const CommonService = require('./CommonService');

const GROUP_MAX_TIME_DIFF_S = 60 * 60 * 6; // 6 Hours

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
  authorId
) {
  const query = `
  UPDATE t_last_change
  SET id_author = $4
  WHERE type_entity = $2 AND type_change = $1 AND id_entity = $3 AND date_change > current_timestamp - interval '1 minute';
  `;
  await CommonService.query(query, [
    changeType,
    entityType,
    entityId,
    authorId,
  ]);
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
    if (c.id_related_entity && g.subAction !== c.type_change)
      g.subAction = 'change'; // eslint-disable-line no-param-reassign
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
  return allGroups.sort((a, b) => b.date - a.date);
}

async function getRecent() {
  // The t_last_change table is populated by trigger on the other main tables
  const query = `
  SELECT tbl.*, author.nickname FROM t_last_change tbl
  LEFT JOIN t_caver author ON tbl.id_author = author.id
  ORDER BY date_change DESC
  `;
  const rep = await CommonService.query(query);

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
  getRecent,
  setNameCreate,
  setDeleteRestoreAuthor,
};
