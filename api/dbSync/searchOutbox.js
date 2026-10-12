// Drains t_search_outbox (sql/9_22_2026_10_12_search_outbox.sql): each row
// records a write, expand() works out the search documents it affects, and
// drain() re-indexes them from the database before deleting the rows.
//
// X* below stands for the entities X and those merged into them (redirect_to):
// a document linked to a merged entity embeds the one it was merged into.

const CommonService = require('../services/CommonService');
const SearchService = require('../services/SearchService');

const BATCH_SIZE = 1000;
const SYNC_CHUNK_SIZE = 1000;
// Stay under the queue expiry (SearchOutboxQueueService)
const TIME_BUDGET_MS = 10 * 60 * 1000;

const COLLECTIONS = [
  'organizations',
  'persons',
  'massifs',
  'caves',
  'entrances',
  'documents',
  'devices',
];
// Kinds that stand for a single search document
const DIRECT_KINDS = ['entrances', 'documents', 'organizations', 'devices'];

const ids = (set) => [...set];

const queryIds = async (sql, params) => {
  const { rows } = await CommonService.query(sql, params);
  return rows.map((r) => r.id);
};

// The columns of a row the change touched: all of them for an insert or a
// delete, the ones whose previous value was recorded for an update
const touched = (row, ...columns) =>
  row.operation !== 'U' ||
  columns.some((c) => Object.hasOwn(row.oldValues ?? {}, c));

const withMerged = async (table, entityIds) => {
  if (entityIds.size === 0) return [];
  const merged = await queryIds(
    `SELECT id FROM ${table} WHERE redirect_to = ANY($1::int[])`,
    [ids(entityIds)]
  );
  return [...new Set([...entityIds, ...merged])];
};

/**
 * The search documents affected by outbox rows.
 *
 * @param {Array<{kind: string, entityId: number, operation: string, oldValues: ?Object}>} rows
 * @returns {Promise<Object<string, Set<number>>>} ids by search collection
 */
async function expand(rows) {
  const targets = Object.fromEntries(COLLECTIONS.map((c) => [c, new Set()]));
  // Caves whose own document changes (entrance count, name)
  const caveEntrances = new Set(); // C*: their entrances embed the cave
  const caveDocuments = new Set(); // C*: their documents embed the cave name
  // Caves named after an entrance (no name row of their own) whose name may
  // have changed: their dependents follow when they have no name row
  const caveNames = new Set();
  const entrancesForCave = new Set(); // entrances whose current cave is touched
  const oldCaves = new Set();
  const entrancesForMassifs = new Set(); // entrances whose current point counts
  const oldPoints = []; // GeoJSON
  const massifPolygons = new Set(); // their entrances embed the massif
  const oldPolygons = []; // hex EWKB
  const entranceDocuments = new Set(); // E*
  const massifDocuments = new Set(); // M*
  const organizationDocuments = new Set(); // G*
  const parentDocuments = new Set();
  const cavers = new Set();

  for (const row of rows) {
    const { kind, entityId: id, oldValues = {} } = row;
    switch (kind) {
      case 'entrance':
        targets.entrances.add(id);
        if (touched(row, 'id_cave', 'is_deleted')) {
          entrancesForCave.add(id);
          if (oldValues?.id_cave) oldCaves.add(oldValues.id_cave);
        }
        if (touched(row, 'point_geom', 'is_deleted')) {
          entrancesForMassifs.add(id);
          if (oldValues?.point_geom) {
            oldPoints.push(JSON.stringify(oldValues.point_geom));
          }
        }
        if (touched(row, 'is_deleted', 'redirect_to')) {
          entranceDocuments.add(id);
        }
        break;
      case 'entrance_name':
        targets.entrances.add(id);
        entranceDocuments.add(id);
        entrancesForCave.add(id);
        break;
      case 'cave':
        targets.caves.add(id);
        caveEntrances.add(id);
        if (touched(row, 'is_deleted', 'redirect_to')) caveDocuments.add(id);
        break;
      case 'cave_name':
        targets.caves.add(id);
        caveEntrances.add(id);
        caveDocuments.add(id);
        break;
      case 'massif':
        targets.massifs.add(id);
        if (touched(row, 'geog_polygon', 'is_deleted')) {
          massifPolygons.add(id);
          if (oldValues?.geog_polygon) oldPolygons.push(oldValues.geog_polygon);
        }
        if (touched(row, 'is_deleted', 'redirect_to')) massifDocuments.add(id);
        break;
      case 'massif_name':
        targets.massifs.add(id);
        massifPolygons.add(id);
        massifDocuments.add(id);
        break;
      case 'organization':
        targets.organizations.add(id);
        if (touched(row, 'is_deleted', 'redirect_to')) {
          organizationDocuments.add(id);
        }
        break;
      case 'organization_name':
        targets.organizations.add(id);
        organizationDocuments.add(id);
        break;
      case 'caver':
        targets.persons.add(id);
        if (touched(row, 'nickname')) cavers.add(id);
        break;
      case 'document':
        targets.documents.add(id);
        parentDocuments.add(id);
        break;
      default:
        if (DIRECT_KINDS.includes(kind)) targets[kind].add(id);
        else sails.log.warn(`[searchOutbox] Unknown kind ${kind}, skipped`);
    }
  }

  // The caves of the touched entrances: their document counts the entrance,
  // and one named after its entrances may change name
  if (entrancesForCave.size > 0) {
    const currentCaves = await queryIds(
      'SELECT DISTINCT id_cave AS id FROM t_entrance WHERE id = ANY($1::int[]) AND id_cave IS NOT NULL',
      [ids(entrancesForCave)]
    );
    for (const caveId of [...currentCaves, ...oldCaves]) {
      targets.caves.add(caveId);
      caveNames.add(caveId);
    }
  }
  if (caveNames.size > 0) {
    const unnamed = await queryIds(
      `SELECT c AS id FROM unnest($1::int[]) AS c
       WHERE NOT EXISTS (SELECT 1 FROM t_name n WHERE n.id_cave = c)`,
      [ids(caveNames)]
    );
    for (const caveId of unnamed) {
      caveEntrances.add(caveId);
      caveDocuments.add(caveId);
    }
  }

  const queries = [];
  const add = (collection, promise) =>
    queries.push(
      promise.then((found) => found.forEach((e) => targets[collection].add(e)))
    );

  if (caveEntrances.size > 0) {
    add(
      'entrances',
      withMerged('t_cave', caveEntrances).then((caves) =>
        queryIds(
          'SELECT id FROM t_entrance WHERE id_cave = ANY($1::int[]) AND is_deleted = false',
          [caves]
        )
      )
    );
  }
  if (caveDocuments.size > 0) {
    add(
      'documents',
      withMerged('t_cave', caveDocuments).then((caves) =>
        queryIds('SELECT id FROM t_document WHERE id_cave = ANY($1::int[])', [
          caves,
        ])
      )
    );
  }
  // Massifs count the live entrances inside their polygon
  if (entrancesForMassifs.size > 0 || oldPoints.length > 0) {
    add(
      'massifs',
      queryIds(
        `WITH points AS (
          SELECT point_geom AS geom FROM t_entrance
          WHERE id = ANY($1::int[]) AND point_geom IS NOT NULL
          UNION ALL
          SELECT ST_SetSRID(ST_GeomFromGeoJSON(p), 4326) FROM unnest($2::text[]) AS p
        )
        SELECT DISTINCT m.id FROM points
        JOIN t_massif m ON points.geom && m.geog_polygon::geometry
          AND ST_Contains(m.geog_polygon::geometry, points.geom)
        WHERE m.is_deleted = false`,
        [ids(entrancesForMassifs), oldPoints]
      )
    );
  }
  // Entrances embed the massifs they are in
  if (massifPolygons.size > 0 || oldPolygons.length > 0) {
    add(
      'entrances',
      queryIds(
        `WITH polygons AS (
          SELECT geog_polygon::geometry AS geom FROM t_massif
          WHERE id = ANY($1::int[]) AND geog_polygon IS NOT NULL
          UNION ALL
          SELECT p::geography::geometry FROM unnest($2::text[]) AS p
        )
        SELECT DISTINCT e.id FROM polygons
        JOIN t_entrance e ON e.point_geom && polygons.geom
          AND ST_Contains(polygons.geom, e.point_geom)
        WHERE e.is_deleted = false`,
        [ids(massifPolygons), oldPolygons]
      )
    );
  }
  if (entranceDocuments.size > 0) {
    add(
      'documents',
      withMerged('t_entrance', entranceDocuments).then((entrances) =>
        queryIds(
          'SELECT DISTINCT id_document AS id FROM j_document_entrance WHERE id_entrance = ANY($1::int[])',
          [entrances]
        )
      )
    );
  }
  if (massifDocuments.size > 0) {
    add(
      'documents',
      withMerged('t_massif', massifDocuments).then((massifs) =>
        queryIds(
          'SELECT DISTINCT id_document AS id FROM j_document_massif WHERE id_massif = ANY($1::int[])',
          [massifs]
        )
      )
    );
  }
  if (organizationDocuments.size > 0) {
    add(
      'documents',
      withMerged('t_grotto', organizationDocuments).then((organizations) =>
        queryIds(
          `SELECT id FROM t_document
           WHERE id_editor = ANY($1::int[]) OR id_library = ANY($1::int[])
           UNION
           SELECT id_document FROM j_document_grotto_author WHERE id_grotto = ANY($1::int[])`,
          [organizations]
        )
      )
    );
  }
  // Children show their parent's title and type
  if (parentDocuments.size > 0) {
    add(
      'documents',
      queryIds('SELECT id FROM t_document WHERE id_parent = ANY($1::int[])', [
        ids(parentDocuments),
      ])
    );
  }
  // Every document shows the nickname of its author, reviewer or validator
  if (cavers.size > 0) {
    const authored = (
      table,
      collection,
      columns = ['id_author', 'id_reviewer']
    ) =>
      add(
        collection,
        queryIds(
          `SELECT id FROM ${table} WHERE is_deleted = false AND (${columns
            .map((c) => `${c} = ANY($1::int[])`)
            .join(' OR ')})`,
          [ids(cavers)]
        )
      );
    authored('t_grotto', 'organizations');
    authored('t_massif', 'massifs');
    authored('t_cave', 'caves');
    authored('t_entrance', 'entrances');
    authored('t_device', 'devices', ['id_author']);
    authored('t_document', 'documents', [
      'id_author',
      'id_reviewer',
      'id_validator',
    ]);
    add(
      'documents',
      queryIds(
        'SELECT DISTINCT id_document AS id FROM j_document_caver_author WHERE id_caver = ANY($1::int[])',
        [ids(cavers)]
      )
    );
  }

  await Promise.all(queries);
  return targets;
}

async function syncTargets(targets) {
  for (const [collectionName, targetIds] of Object.entries(targets)) {
    const all = [...targetIds].sort((a, b) => a - b);
    for (let i = 0; i < all.length; i += SYNC_CHUNK_SIZE) {
      // eslint-disable-next-line no-await-in-loop
      await SearchService.syncDocuments(
        collectionName,
        all.slice(i, i + SYNC_CHUNK_SIZE)
      );
    }
  }
}

/**
 * Re-index what the outbox rows affect, oldest first, then delete the rows.
 * A sync that throws (Typesense unreachable…) leaves the batch in the outbox
 * for the next run; a document Typesense rejects is logged and dropped.
 *
 * @returns {Promise<number>} the number of outbox rows processed
 */
async function drain({
  batchSize = BATCH_SIZE,
  timeBudgetMs = TIME_BUDGET_MS,
} = {}) {
  const start = Date.now();
  let processed = 0;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { rows } = await CommonService.query(
      `SELECT id, kind, id_entity AS "entityId", operation, old_values AS "oldValues"
       FROM t_search_outbox ORDER BY id LIMIT $1`,
      [batchSize]
    );
    if (rows.length === 0) break;

    // eslint-disable-next-line no-await-in-loop
    await syncTargets(await expand(rows));
    // eslint-disable-next-line no-await-in-loop
    await CommonService.query(
      'DELETE FROM t_search_outbox WHERE id = ANY($1::bigint[])',
      [rows.map((r) => r.id)]
    );
    processed += rows.length;

    if (rows.length < batchSize || Date.now() - start > timeBudgetMs) break;
  }
  return processed;
}

module.exports = { expand, drain };
