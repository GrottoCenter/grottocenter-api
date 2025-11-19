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
  const out = Object.entries(filter)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      let vFmt = v;
      let operator = ':'; // Partial equal
      if (Array.isArray(v))
        vFmt = `[${v.join('..')}]`; // Range
      else if (typeof v === 'boolean' || typeof v === 'number')
        operator = ':='; // Exact equal
      else vFmt = `\`${v}\``;
      return `${k}${operator}${vFmt}`;
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

  const params = {
    q,
    query_by: allEntities[entity].query.query_by,
    page, // Page starts at 1
    per_page: size,
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
