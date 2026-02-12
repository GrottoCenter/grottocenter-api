const typesense = require('../../config/typesense');

const organization = require('../dbSync/entities/organization');
const person = require('../dbSync/entities/person');
const massif = require('../dbSync/entities/massif');
const entrance = require('../dbSync/entities/entrance');
const cave = require('../dbSync/entities/cave');
const document = require('../dbSync/entities/document');

const allEntities = {
  [organization.search.schema.name]: organization.search,
  [person.search.schema.name]: person.search,
  [massif.search.schema.name]: massif.search,
  [cave.search.schema.name]: cave.search,
  [entrance.search.schema.name]: entrance.search,
  [document.search.schema.name]: document.search,
};
const allEntitiesKeys = Object.keys(allEntities);

/**
 * Increment the last numeric segment of a date string to compute
 * an exclusive upper bound for prefix-based range filtering.
 * Works with any depth: "2025" -> "2026", "2025-01" -> "2025-02",
 * "2025-12" -> "2026-01", "2025-01-31" -> "2025-02-01", etc.
 */
function getDateUpperBound(value) {
  const parts = value.split('-').map(Number);
  if (parts.some(Number.isNaN)) return null;

  // Increment from the last segment, carrying over when needed
  // Limits: month max 12, day max 31 (intentionally simple ceiling)
  const limits = [Infinity, 12, 31];
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    parts[i] += 1;
    if (parts[i] <= (limits[i] ?? Infinity)) break;
    parts[i] = 1;
    if (i === 0) return null; // overflow past year — shouldn't happen in practice
  }

  return parts
    .map((p, i) => (i === 0 ? `${p}` : String(p).padStart(2, '0')))
    .join('-');
}

function buildFilter(filter, isLogicalCompareAnd = true) {
  const out = Object.entries(filter)
    .filter(([, v]) => v)
    .flatMap(([k, v]) => {
      // For datePublication, use a range filter so that partial dates
      // (year, year-month, or full date) match all more-specific entries.
      // e.g. "2025" matches "2025", "2025-01", "2025-01-15", etc.
      if (k === 'datePublication' && typeof v === 'string') {
        const upperBound = getDateUpperBound(v);
        if (upperBound) {
          return [`${k}:>=${v}`, `${k}:<${upperBound}`];
        }
      }

      let vFmt = v;
      let operator = ':'; // Partial equal
      if (Array.isArray(v))
        vFmt = `[${v.join('..')}]`; // Range
      else if (typeof v === 'boolean' || typeof v === 'number')
        operator = ':='; // Exact equal
      else vFmt = `\`${v}\``;
      return [`${k}${operator}${vFmt}`];
    });
  return out.join(isLogicalCompareAnd ? ' && ' : ' || ');
}

async function isAlive() {
  return typesense.isAlive();
}

async function deleteDocument(entityName, documentId) {
  if (process.env.NODE_ENV === 'test') {
    sails.log.info('SearchDb delete is disabled in during test');
    return;
  }
  if (!allEntitiesKeys.includes(entityName)) return;
  await typesense.deleteDocument(entityName, documentId);
}

async function updateDocument(entityName, doc) {
  if (process.env.NODE_ENV === 'test') {
    sails.log.info('SearchDb upadet is disabled in during test');
    return;
  }
  if (!allEntitiesKeys.includes(entityName)) return;
  await typesense
    .importDocuments(entityName, [doc], allEntities[entityName].importFormater)
    .catch((err) => {
      sails.log.error(
        'Error in SearchService updateDocument',
        entityName,
        doc,
        err
      );
    });
}

async function multiCollectionsSearch({
  query,
  entities = [],
  filter = {},
} = {}) {
  // eslint-disable-next-line no-param-reassign
  entities = entities.filter((e) => allEntitiesKeys.includes(e));
  if (entities.length === 0) return null;
  const q = query || '*';
  const filterBy = buildFilter(filter);

  const collections = entities.map((e) => ({
    collection: e,
    query_by: allEntities[e].query.query_by,
    ...(filterBy && { filter_by: filterBy }),
  }));

  return typesense.multiSearch(collections, {
    per_page: 20,
    q,
  });
}

async function collectionSearch({
  query,
  entity = [],
  sort,
  filter = {},
  isLogicalCompareAnd = true,
  page,
  size,
  fields,
} = {}) {
  if (!allEntitiesKeys.includes(entity)) return null;
  const q = query || '*';
  const filterBy = buildFilter(filter, isLogicalCompareAnd);

  // Cap size at Typesense's limit of 1000 hits per page
  const perPage = size ? Math.min(size, 1000) : size;

  const params = {
    q,
    query_by: allEntities[entity].query.query_by,
    page, // Page starts at 1
    per_page: perPage,
    ...(sort && { sort_by: `${sort},_text_match:desc` }),
    ...(filterBy && { filter_by: filterBy }),
    ...(fields && { include_fields: fields.join(',') }),
  };

  return typesense.search(entity, params);
}

async function fieldSearch({
  entity,
  field,
  query,
  filter = {},
  size,
  isLogicalCompareAnd = true,
} = {}) {
  if (!allEntitiesKeys.includes(entity)) return null;
  if (!field) return null;
  const q = query || '*';
  const filterBy = buildFilter(filter, isLogicalCompareAnd);

  const params = {
    q,
    query_by: field,
    group_by: field,
    group_limit: 1,
    sort_by: '_group_found:desc',
    per_page: size,
    ...(filterBy && { filter_by: filterBy }),
  };

  return typesense.search(entity, params);
}

module.exports = {
  isAlive,

  updateDocument,
  deleteDocument,

  multiCollectionsSearch,
  collectionSearch,
  fieldSearch,
};
