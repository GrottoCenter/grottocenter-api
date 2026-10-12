const CommonService = require('../services/CommonService');
const syncUtils = require('./utils');

const organization = require('./entities/organization');
const person = require('./entities/person');
const massif = require('./entities/massif');
const entrance = require('./entities/entrance');
const cave = require('./entities/cave');
const document = require('./entities/document');
const device = require('./entities/device');

const ENTITIES = Object.fromEntries(
  [organization, person, massif, entrance, cave, document, device].map((e) => [
    e.search.schema.name,
    e,
  ])
);

function getEntity(collectionName) {
  const entity = ENTITIES[collectionName];
  if (!entity) throw new Error(`Unknown search collection ${collectionName}`);
  return entity;
}

// Ids come from route params, models or SQL rows: keep the positive integers once
function normalizeIds(ids) {
  return [...new Set((ids ?? []).map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0
  );
}

/**
 * Build the search documents of the given ids with the full rebuild's own
 * query and processRows, so a single update and a rebuild cannot disagree.
 * Ids the rebuild would not index (deleted, missing, not validated…) are absent.
 * The documents are not formatted yet: the collection's importFormater does it
 * on import.
 *
 * @param {string} collectionName search collection (entrances, caves…)
 * @param {Array<number|string>} ids
 * @returns {Promise<Object[]>}
 */
async function buildDocuments(collectionName, ids) {
  const entity = getEntity(collectionName);
  const uniqueIds = normalizeIds(ids);
  const documents = [];
  if (uniqueIds.length === 0) return documents;

  const pages = syncUtils.idsQuery(entity.name, entity.query, uniqueIds);
  for await (const row of entity.processRows(pages)) documents.push(row);
  return documents;
}

/**
 * Work out how to bring the given ids of a collection up to date: the
 * documents to upsert, and the ids to remove from the index.
 * An id that is not built is removed, unless the collection retains it (a
 * document pending re-validation keeps its last validated version).
 *
 * @param {string} collectionName
 * @param {Array<number|string>} ids
 * @returns {Promise<{documents: Object[], removedIds: number[]}>}
 */
async function planSync(collectionName, ids) {
  const entity = getEntity(collectionName);
  const uniqueIds = normalizeIds(ids);
  const documents = await buildDocuments(collectionName, uniqueIds);

  const builtIds = new Set(documents.map((e) => e.id));
  let removedIds = uniqueIds.filter((id) => !builtIds.has(id));

  const { retainedIdsQuery } = entity.search;
  if (removedIds.length > 0 && retainedIdsQuery) {
    const { rows } = await CommonService.query(retainedIdsQuery, [removedIds]);
    const retainedIds = new Set(rows.map((e) => e.id));
    removedIds = removedIds.filter((id) => !retainedIds.has(id));
  }

  return { documents, removedIds };
}

module.exports = { getEntity, normalizeIds, buildDocuments, planSync };
