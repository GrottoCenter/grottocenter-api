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

function buildFilter(filter, isLogicalCompareAnd = true) {
  let hasPrefixFilter = false;
  const out = Object.entries(filter)
    .filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      return true;
    })
    .flatMap(([k, v]) => {
      // For datePublication, use a prefix filter so that partial dates
      // (year, year-month, or full date) match all more-specific entries.
      // e.g. "2025" matches "2025", "2025-01", "2025-01-15", etc.
      // Typesense supports prefix matching on string fields with := and *.
      const trimmed = typeof v === 'string' ? v.trim() : v;

      if (k === 'datePublication' && typeof trimmed === 'string') {
        hasPrefixFilter = true;
        return [`${k}:=${trimmed}*`];
      }

      let vFmt = trimmed;
      let operator = ':'; // Partial equal
      if (Array.isArray(trimmed)) {
        if (trimmed.length === 0) return []; // Skip empty arrays
        const isNumericRange =
          trimmed.length === 2 && trimmed.every((el) => typeof el === 'number');
        if (isNumericRange) {
          vFmt = `[${trimmed.join('..')}]`; // Numeric range
        } else {
          // Multi-value exact match (non-numeric-range arrays)
          operator = ':=';
          vFmt = `[${trimmed.map((el) => `\`${String(el).replace(/`/g, '')}\``).join(',')}]`;
        }
      } else if (typeof trimmed === 'boolean' || typeof trimmed === 'number')
        operator = ':='; // Exact equal
      else vFmt = `\`${trimmed.replace(/`/g, '')}\``;
      return [`${k}${operator}${vFmt}`];
    });
  return {
    filterBy: out.join(isLogicalCompareAnd ? ' && ' : ' || '),
    hasPrefixFilter,
  };
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
  const { filterBy, hasPrefixFilter } = buildFilter(filter);

  const collections = entities.map((e) => ({
    collection: e,
    query_by: allEntities[e].query.query_by,
    ...(filterBy && { filter_by: filterBy }),
  }));

  return typesense.multiSearch(collections, {
    per_page: 20,
    q,
    // Typesense defaults max_filter_by_candidates to 4, which is too low
    // for prefix filters like datePublication:=2025* that can match many
    // distinct values (2025, 2025-01, …, 2025-12, 2025-01-15, etc.).
    ...(hasPrefixFilter && { max_filter_by_candidates: 100 }),
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
  const { filterBy, hasPrefixFilter } = buildFilter(
    filter,
    isLogicalCompareAnd
  );

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
    // Typesense defaults max_filter_by_candidates to 4, which is too low
    // for prefix filters like datePublication:=2025* that can match many
    // distinct values (2025, 2025-01, …, 2025-12, 2025-01-15, etc.).
    ...(hasPrefixFilter && { max_filter_by_candidates: 100 }),
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
  const { filterBy, hasPrefixFilter } = buildFilter(
    filter,
    isLogicalCompareAnd
  );

  const params = {
    q,
    query_by: field,
    group_by: field,
    group_limit: 1,
    sort_by: '_group_found:desc',
    per_page: size,
    ...(filterBy && { filter_by: filterBy }),
    ...(hasPrefixFilter && { max_filter_by_candidates: 100 }),
  };

  return typesense.search(entity, params);
}

module.exports = {
  allEntities,
  allEntitiesKeys,

  isAlive,

  updateDocument,
  deleteDocument,

  multiCollectionsSearch,
  collectionSearch,
  fieldSearch,
};
