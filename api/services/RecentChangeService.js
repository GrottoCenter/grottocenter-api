const CommonService = require('./CommonService');

const GROUP_MAX_TIME_DIFF_S = 60 * 60 * 6; // 6 Hours

// Dashboard only needs a short lookback; 7 days covers the typical review cycle
// while keeping the query fast on the unpartitioned t_last_change table.
const RECENT_CHANGES_WINDOW_DAYS = 7;
// Hard cap to avoid oversized payloads — the dashboard is a summary, not a full audit log.
const RECENT_CHANGES_LIMIT = 500;

async function removeOlderChanges() {
  const query = `DELETE FROM t_last_change WHERE date_change < current_timestamp - interval '1 month';`;
  await CommonService.query(query);
}

// When creating a cave, entrance, massif, document or grotto the name is created after the entity
// So the name is updated afterward
async function setNameCreate(entityType, entityId, authorId, name) {
  const query = `
  UPDATE t_last_change
  SET name = $1
  WHERE type_entity = $2 AND type_change = 'create' AND id_entity = $3 AND id_author = $4 AND date_change > current_timestamp - interval '1 minute';
  `;
  await CommonService.query(query, [name, entityType, entityId, authorId]);
}

// When deleting / restoring an entity, the author is not historized, so it is updated afterward
async function setDeleteRestoreAuthor(
  changeType,
  entityType,
  entityId,
  authorId,
  db
) {
  const query = `
  UPDATE t_last_change
  SET id_author = $4
  WHERE type_entity = $2 AND type_change = $1 AND id_entity = $3 AND date_change > current_timestamp - interval '1 minute';
  `;
  await CommonService.query(
    query,
    [changeType, entityType, entityId, authorId],
    db
  );
}

// change_document() only logs a document when it becomes validated (#1781), so
// an edit applied directly to an already validated document is logged here, by
// the code path that knows who made it. Only validated documents are public.
// Named after the document's first description, as the trigger does.
async function logDocumentUpdate(documentId, authorId, db) {
  const query = `
  INSERT INTO t_last_change (type_entity, type_change, date_change, id_entity, id_author, name)
  SELECT 'document', 'update', now(), d.id, $2,
    (SELECT tdesc.title FROM t_description tdesc WHERE tdesc.id_document = d.id LIMIT 1)
  FROM t_document d
  WHERE d.id = $1 AND d.is_validated = true AND d.is_deleted = false;
  `;
  await CommonService.query(query, [documentId, authorId], db);
}

// To make the change list more relevant we groups change event when they are from the same author and about the same entity
function groupChanges(changes) {
  const authorChanges = {};
  // Grouping order:
  // - author
  // - related entity
  // - time
  // Change type 'create' or 'restore' have priority over 'update'
  // Change type 'delete' is never grouped

  const createNewGroupFromChange = (c) => ({
    date: c.date_change,
    authorId: c.id_author,
    author: c.nickname,
    mainEntityType: c.type_related_entity ?? c.type_entity,
    mainEntityId: c.id_related_entity ?? c.id_entity,
    mainAction: c.id_related_entity ? null : c.type_change, // Null in case it is a change on a sub entity
    subEntityTypes: c.id_related_entity ? [c.type_entity] : [],
    subAction: c.id_related_entity ? c.type_change : null, // Null when no sub entities
    // Tracks the entity id that last set subAction, so we can apply
    // create/restore priority correctly when the same entity is later
    // seen with a higher-priority action (e.g. create after update).
    subActionEntityId: c.id_related_entity ? c.id_entity : null,
    name: c.name, // Can be the real entity name or the related entity name
  });

  const addChangeToExistingGroup = (g, c) => {
    if (
      !c.id_related_entity &&
      g.mainAction === 'update' &&
      ['create', 'restore'].includes(c.type_change)
    )
      g.mainAction = c.type_change; // eslint-disable-line no-param-reassign
    if (c.id_related_entity && !g.subEntityTypes.includes(c.type_entity))
      g.subEntityTypes.push(c.type_entity);
    if (c.id_related_entity && g.subAction !== c.type_change) {
      // 'create' and 'restore' take priority over 'update' only when it is the
      // same entity that produced both events (e.g. a sub-entity was created
      // then edited within the grouping window).  When different entity ids are
      // involved the author genuinely performed mixed actions → 'change'.
      if (
        g.subAction === 'update' &&
        ['create', 'restore'].includes(c.type_change) &&
        g.subActionEntityId === c.id_entity
      ) {
        g.subAction = c.type_change; // eslint-disable-line no-param-reassign
        // subActionEntityId is already equal to c.id_entity (checked above).
      } else if (
        ['create', 'restore'].includes(g.subAction) &&
        c.type_change === 'update' &&
        g.subActionEntityId === c.id_entity
      ) {
        // 'create'/'restore' already wins — an incoming 'update' for the same
        // entity must not downgrade it.  Leave subAction and subActionEntityId
        // untouched.
      } else {
        g.subAction = 'change'; // eslint-disable-line no-param-reassign
        g.subActionEntityId = null; // eslint-disable-line no-param-reassign
      }
    }
  };

  for (const change of changes) {
    if (!authorChanges[change.id_author]) {
      authorChanges[change.id_author] = [createNewGroupFromChange(change)];
      continue; // eslint-disable-line no-continue
    }

    const authorsChanges = authorChanges[change.id_author];
    const previousChangeForThisEntity = authorsChanges.find(
      (e) =>
        e.mainEntityId === (change.id_related_entity ?? change.id_entity) &&
        e.mainEntityType === (change.type_related_entity ?? change.type_entity)
    );

    if (
      !previousChangeForThisEntity ||
      Math.abs(previousChangeForThisEntity.date - change.date_change) >
        GROUP_MAX_TIME_DIFF_S * 1000 ||
      change.type_change === 'delete' ||
      previousChangeForThisEntity.mainAction === 'delete'
    ) {
      authorsChanges.unshift(createNewGroupFromChange(change));
      continue; // eslint-disable-line no-continue
    }
    addChangeToExistingGroup(previousChangeForThisEntity, change);
  }

  const allGroups = Object.values(authorChanges).flat();
  return allGroups
    .sort((a, b) => b.date - a.date)
    .map(({ subActionEntityId, ...group }) => group); // strip internal tracking field
}

// SQL condition true when a change of t_last_change (alias tbl) concerns an
// area. `entranceInArea` is a condition on an entrance aliased e; `extra` lists
// the conditions for changes that are not attached to an entrance; `document`
// lists the conditions on a document aliased d that is linked to the area
// without going through an entrance.
//
// Current relationships are used, whether the related rows are deleted or not,
// so the deletion of an entrance still shows up in its area:
// - an entrance, and its sub-entities (comments, descriptions, histories,
//   locations, riggings), through the entrance
// - a cave, and the descriptions of a cave, through any entrance of the cave,
//   so a network concerns every area one of its entrances is in
// - a document, through the entrances it is linked to (j_document_entrance),
//   the entrances of the cave it belongs to (t_document.id_cave), or a direct
//   link to the area listed in `document`
function concernsArea(entranceInArea, extra = [], document = []) {
  const entranceWhere = (join) =>
    `EXISTS (SELECT 1 FROM t_entrance e WHERE ${join} AND ${entranceInArea})`;
  return `(
    (tbl.type_entity = 'entrance' AND ${entranceWhere('e.id = tbl.id_entity')})
    OR (tbl.type_related_entity = 'entrance' AND ${entranceWhere(
      'e.id = tbl.id_related_entity'
    )})
    OR (tbl.type_entity = 'cave' AND ${entranceWhere(
      'e.id_cave = tbl.id_entity'
    )})
    OR (tbl.type_related_entity = 'cave' AND ${entranceWhere(
      'e.id_cave = tbl.id_related_entity'
    )})
    OR (tbl.type_entity = 'document' AND EXISTS (
      SELECT 1 FROM t_document d WHERE d.id = tbl.id_entity AND (
        EXISTS (
          SELECT 1 FROM j_document_entrance jde
          JOIN t_entrance e ON e.id = jde.id_entrance
          WHERE jde.id_document = d.id AND ${entranceInArea}
        )
        OR ${entranceWhere('e.id_cave = d.id_cave')}
        ${document.map((c) => `OR ${c}`).join('\n        ')}
      )
    ))
    ${extra.map((c) => `OR ${c}`).join('\n    ')}
  )`;
}

// Builds the WHERE conditions and parameters for the optional filters of
// getRecent(). Each filter is one condition, so filters combine with AND, and
// each is an EXISTS, so a change matching several relationships is returned
// once.
function buildFilterConditions(filters = {}) {
  const conditions = [];
  const params = [];
  const param = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (filters.countryId !== undefined) {
    const p = param(filters.countryId);
    conditions.push(
      concernsArea(
        `e.id_country = ${p}`,
        [
          `(tbl.type_entity = 'grotto' AND EXISTS (SELECT 1 FROM t_grotto g WHERE g.id = tbl.id_entity AND g.id_country = ${p}))`,
        ],
        [
          `EXISTS (SELECT 1 FROM j_document_country jdc WHERE jdc.id_document = d.id AND jdc.id_country = ${p})`,
          `EXISTS (SELECT 1 FROM j_document_iso3166_2 jdi WHERE jdi.id_document = d.id AND jdi.id_iso LIKE ${p} || '-%')`,
        ]
      )
    );
  }

  if (filters.regionId !== undefined) {
    const p = param(filters.regionId);
    conditions.push(
      concernsArea(
        `e.iso_3166_2 = ${p}`,
        [
          `(tbl.type_entity = 'grotto' AND EXISTS (SELECT 1 FROM t_grotto g WHERE g.id = tbl.id_entity AND g.iso_3166_2 = ${p}))`,
        ],
        [
          `EXISTS (SELECT 1 FROM j_document_iso3166_2 jdi WHERE jdi.id_document = d.id AND jdi.id_iso = ${p})`,
        ]
      )
    );
  }

  if (filters.massifId !== undefined) {
    const p = param(filters.massifId);
    conditions.push(
      concernsArea(
        `EXISTS (SELECT 1 FROM t_massif m WHERE m.id = ${p} AND e.point_geom && m.geog_polygon::geometry AND ST_Contains(m.geog_polygon::geometry, e.point_geom))`,
        [
          `(tbl.type_entity = 'massif' AND tbl.id_entity = ${p})`,
          `(tbl.type_related_entity = 'massif' AND tbl.id_related_entity = ${p})`,
        ],
        [
          `d.id_massif = ${p}`,
          `EXISTS (SELECT 1 FROM j_document_massif jdm WHERE jdm.id_document = d.id AND jdm.id_massif = ${p})`,
        ]
      )
    );
  }

  if (filters.organizationId !== undefined) {
    // The author of the change, as a current member of the organization
    const p = param(filters.organizationId);
    conditions.push(
      `EXISTS (SELECT 1 FROM j_grotto_caver jgc WHERE jgc.id_caver = tbl.id_author AND jgc.id_grotto = ${p})`
    );
  }

  return { conditions, params };
}

/**
 * Recent changes, grouped by author and entity, newest first.
 *
 * @param {object} [filters] optional filters, combined with AND and applied
 *   before the RECENT_CHANGES_LIMIT cap on raw changes
 * @param {string} [filters.countryId] ISO 3166-1 alpha-2 code
 * @param {string} [filters.regionId] full ISO 3166-2 code
 * @param {number} [filters.massifId]
 * @param {number} [filters.organizationId] changes by current members
 */
async function getRecent(filters = {}) {
  const { conditions, params } = buildFilterConditions(filters);
  // The t_last_change table is populated by trigger on the other main tables
  const query = `
  SELECT tbl.*, author.nickname FROM t_last_change tbl
  LEFT JOIN t_caver author ON tbl.id_author = author.id
  WHERE tbl.date_change > current_timestamp - interval '${RECENT_CHANGES_WINDOW_DAYS} days'
  ${conditions.map((c) => `AND ${c}`).join('\n  ')}
  ORDER BY date_change DESC
  LIMIT ${RECENT_CHANGES_LIMIT}
  `;
  const rep = await CommonService.query(query, params);

  // When creating/updating a entrance the associated cave is also created/updated (when not part of a network)
  // As cave changes are duplicate we filter out them
  const changes = rep.rows.filter((e, i, a) => {
    if (e.type_entity !== 'cave') return true;

    // Is the cave change is after the entrance change ?
    if (
      i < a.length - 2 &&
      a[i + 1].date_change - e.date_change < 5000 &&
      a[i + 1].id_author === e.id_author &&
      a[i + 1].type_entity === 'entrance'
    )
      return false;

    // Is the cave change is before the entrance change ?
    if (
      i > 0 &&
      e.date_change - a[i - 1].date_change < 5000 &&
      a[i - 1].id_author === e.id_author &&
      a[i - 1].type_entity === 'entrance'
    )
      return false;

    return true;
  });

  // 5% chance to also remove older changes
  if (Math.random() < 0.05) removeOlderChanges();

  return groupChanges(changes);
}

module.exports = {
  RECENT_CHANGES_WINDOW_DAYS,
  RECENT_CHANGES_LIMIT,
  getRecent,
  buildFilterConditions,
  setNameCreate,
  setDeleteRestoreAuthor,
  logDocumentUpdate,
};
