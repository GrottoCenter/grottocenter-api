/**
 * BotQuarantineService.js
 *
 * @description :: The quarantine report of the bot surface (#1762): the live
 *   free texts the coordinate detector withheld (t_bot_text_scan.matched), with
 *   the record that owns each one, so a moderator can fix them. The only way
 *   out of quarantine is an edit: there is no dismiss action.
 *
 * A text is quarantined when its verdict matched and the text is live
 * (not deleted, not blank). A deleted text is never published, so it is not
 * the moderators' business.
 */

const coordinateDetector = require('../../utils/coordinateDetector');

const ENTITY_TYPES = [
  'cave',
  'entrance',
  'massif',
  'organization',
  'document',
  'other',
];
// 'error' is the pattern id recorded when the detector threw
const PATTERN_IDS = [...coordinateDetector.PATTERN_IDS, 'error'];

// One row per quarantined text on a record that is neither deleted nor merged
// (a text on a deleted or merged record never reaches a bot page, and would
// inflate the backlog at every merge). The owner of a description is the record it is
// attached to, the owner of a name is the record it names. Anything else
// (a point, an observation) is 'other'.
const QUARANTINED_SQL = `
  SELECT s.source_table, s.source_id, s.pattern_id, s.match_excerpt, s.scanned_at,
         o.entity_type, o.entity_id, o.language, o.own_title
  FROM t_bot_text_scan s
  JOIN (
    SELECT 't_description'::text AS source_table, d.id AS source_id,
           CASE WHEN d.id_cave IS NOT NULL THEN 'cave'
                WHEN d.id_entrance IS NOT NULL THEN 'entrance'
                WHEN d.id_massif IS NOT NULL THEN 'massif'
                WHEN d.id_document IS NOT NULL THEN 'document'
                ELSE 'other' END AS entity_type,
           COALESCE(d.id_cave, d.id_entrance, d.id_massif, d.id_document) AS entity_id,
           d.id_language AS language,
           d.title AS own_title
    FROM t_description d
    LEFT JOIN t_cave oc ON oc.id = d.id_cave
    LEFT JOIN t_entrance oe ON oe.id = d.id_entrance
    LEFT JOIN t_massif om ON om.id = d.id_massif
    LEFT JOIN t_document od ON od.id = d.id_document
    WHERE d.is_deleted = false
      AND (d.id_cave IS NULL OR (oc.is_deleted = false AND oc.redirect_to IS NULL))
      AND (d.id_entrance IS NULL OR (oe.is_deleted = false AND oe.redirect_to IS NULL))
      AND (d.id_massif IS NULL OR (om.is_deleted = false AND om.redirect_to IS NULL))
      AND (d.id_document IS NULL OR (od.is_deleted = false AND od.redirect_to IS NULL))
      AND (btrim(COALESCE(d.title, '')) <> '' OR btrim(COALESCE(d.body, '')) <> '')
    UNION ALL
    SELECT 't_name'::text, n.id,
           CASE WHEN n.id_cave IS NOT NULL THEN 'cave'
                WHEN n.id_entrance IS NOT NULL THEN 'entrance'
                WHEN n.id_massif IS NOT NULL THEN 'massif'
                WHEN n.id_grotto IS NOT NULL THEN 'organization'
                ELSE 'other' END,
           COALESCE(n.id_cave, n.id_entrance, n.id_massif, n.id_grotto),
           n.id_language,
           n.name
    FROM t_name n
    LEFT JOIN t_cave oc ON oc.id = n.id_cave
    LEFT JOIN t_entrance oe ON oe.id = n.id_entrance
    LEFT JOIN t_massif om ON om.id = n.id_massif
    LEFT JOIN t_grotto og ON og.id = n.id_grotto
    WHERE n.is_deleted = false AND btrim(COALESCE(n.name, '')) <> ''
      AND (n.id_cave IS NULL OR (oc.is_deleted = false AND oc.redirect_to IS NULL))
      AND (n.id_entrance IS NULL OR (oe.is_deleted = false AND oe.redirect_to IS NULL))
      AND (n.id_massif IS NULL OR (om.is_deleted = false AND om.redirect_to IS NULL))
      AND (n.id_grotto IS NULL OR (og.is_deleted = false AND og.redirect_to IS NULL))
  ) o ON o.source_table = s.source_table AND o.source_id = s.source_id
  WHERE s.matched`;

const query = (sql, params) => CommonService.query(sql, params);

// The id column of the main name of each type, in t_name
const NAME_COLUMN = {
  cave: 'id_cave',
  entrance: 'id_entrance',
  massif: 'id_massif',
  organization: 'id_grotto',
};

/** Main names of the given records, `Map<"type:id", name>`. */
const loadEntityNames = async (items) => {
  const names = new Map();
  await Promise.all(
    Object.entries(NAME_COLUMN).map(async ([type, column]) => {
      const ids = [
        ...new Set(
          items.filter((i) => i.entityType === type).map((i) => i.entityId)
        ),
      ];
      if (ids.length === 0) return;
      const { rows } = await query(
        `SELECT DISTINCT ON (${column}) ${column} AS id, name
         FROM t_name
         WHERE ${column} = ANY($1::int[]) AND is_deleted = false
         ORDER BY ${column}, is_main DESC, id`,
        [ids]
      );
      rows.forEach((r) => names.set(`${type}:${r.id}`, r.name));
    })
  );
  return names;
};

module.exports = {
  ENTITY_TYPES,
  PATTERN_IDS,

  /** Number of quarantined texts, whatever the pattern version they were scanned at. */
  async total() {
    const { rows } = await query(
      `SELECT count(*)::int AS n FROM (${QUARANTINED_SQL}) q`
    );
    return rows[0].n;
  },

  /**
   * @param {object} filters
   * @param {string} [filters.entityType] one of ENTITY_TYPES
   * @param {string} [filters.patternId] one of PATTERN_IDS
   * @param {string} [filters.language] language id of the text, e.g. `fra`
   * @param {number} filters.skip
   * @param {number} filters.limit
   * @returns {Promise<object>} `{ totalCount, items, aggregates, trend }`.
   *   `totalCount` counts the filtered items (for the pages); `aggregates` are
   *   always over the whole backlog, so they add up to its total.
   */
  async report({ entityType, patternId, language, skip, limit }) {
    const where = [];
    const params = [];
    const add = (sql, value) => {
      params.push(value);
      where.push(sql.replace('?', `$${params.length}`));
    };
    if (entityType) add('q.entity_type = ?', entityType);
    if (patternId) add('q.pattern_id = ?', patternId);
    if (language) add('q.language = ?', language);
    const filter = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // One statement, so the quarantined set is computed once and takes one
    // connection: the page, the filtered count and the aggregates share it.
    const [
      {
        rows: [report],
      },
      runs,
    ] = await Promise.all([
      query(
        `WITH q AS MATERIALIZED (${QUARANTINED_SQL}),
              f AS (SELECT * FROM q ${filter})
         SELECT
           (SELECT count(*)::int FROM f) AS total_count,
           (SELECT COALESCE(json_agg(p ORDER BY p.scanned_at DESC, p.source_table, p.source_id), '[]'::json)
              FROM (SELECT * FROM f
                    ORDER BY scanned_at DESC, source_table, source_id
                    OFFSET $${params.length + 1} LIMIT $${params.length + 2}) p) AS items,
           (SELECT COALESCE(json_object_agg(pattern_id, n), '{}'::json)
              FROM (SELECT pattern_id, count(*)::int AS n FROM q GROUP BY 1) a) AS by_pattern,
           (SELECT COALESCE(json_object_agg(entity_type, n), '{}'::json)
              FROM (SELECT entity_type, count(*)::int AS n FROM q GROUP BY 1) a) AS by_type`,
        [...params, skip, limit]
      ),
      // The two latest runs that recorded a total (runs before #1762 did not,
      // and a run whose count failed holds no value)
      query(
        `SELECT id, finished_at,
                (counts->'scan'->>'patternVersion')::int AS pattern_version,
                (counts->'scan'->>'quarantineTotal')::int AS total
         FROM t_bot_pipeline_run
         WHERE status = 'succeeded'
           AND counts->'scan'->>'quarantineTotal' IS NOT NULL
         ORDER BY started_at DESC LIMIT 2`
      ),
    ]);

    const rawItems = report.items.map((r) => ({
      sourceTable: r.source_table,
      sourceId: r.source_id,
      type: r.entity_type,
      id: r.entity_id,
      ownTitle: r.own_title,
      language: r.language,
      patternId: r.pattern_id,
      matchExcerpt: r.match_excerpt,
      scannedAt: new Date(r.scanned_at),
    }));
    const names = await loadEntityNames(
      rawItems.map((i) => ({ entityType: i.type, entityId: i.id }))
    );
    const items = rawItems.map((i) => ({
      sourceTable: i.sourceTable,
      sourceId: i.sourceId,
      entity: {
        type: i.type,
        id: i.id,
        // A document has no name of its own: its descriptions carry the title
        name:
          names.get(`${i.type}:${i.id}`) ??
          (i.type === 'document' ? i.ownTitle : null),
      },
      language: i.language,
      patternId: i.patternId,
      matchExcerpt: i.matchExcerpt,
      scannedAt: i.scannedAt,
    }));

    const byPatternId = report.by_pattern;
    const byEntityType = report.by_type;
    const toRun = (r) =>
      r && {
        runId: r.id,
        finishedAt: r.finished_at,
        patternVersion: r.pattern_version,
        total: r.total,
      };
    const [latest, previous] = runs.rows.map(toRun);

    return {
      totalCount: report.total_count,
      skip,
      limit,
      items,
      aggregates: {
        total: Object.values(byEntityType).reduce((a, b) => a + b, 0),
        byPatternId,
        byEntityType,
      },
      trend: {
        currentPatternVersion: coordinateDetector.PATTERN_SET_VERSION,
        latest: latest ?? null,
        previous: previous ?? null,
      },
    };
  },
};
