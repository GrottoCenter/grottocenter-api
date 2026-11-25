/**
 * Fake live search collections for the tests that go through SearchService's
 * index check (checkIndexSchema, and the search guard built on it). Stubbing
 * config/typesense.retrieveFieldNames keeps those tests off a real Typesense,
 * whose collections may be out of date on a developer machine.
 *
 * Call these inside a test hook, after Sails has lifted: the entity schemas
 * are required lazily for the same reason.
 */

// Same as Typesense: the implicit `id` field is not listed.
const fieldNames = (name, missing = {}) => {
  // eslint-disable-next-line global-require
  const { ENTITIES } = require('../../api/dbSync/searchDocuments');
  const { fields } = Object.values(ENTITIES)
    .map((e) => e.search.schema)
    .find((schema) => schema.name === name);
  return fields
    .map((field) => field.name)
    .filter((n) => n !== 'id' && !(missing[name] ?? []).includes(n));
};

/**
 * Make `stub` (a sinon stub of typesense.retrieveFieldNames) answer with the
 * fields every collection declares, minus those in `missing`
 * ({ collectionName: [fieldName] }).
 */
const useLiveFields = (stub, missing = {}) =>
  stub.callsFake(async (name) => fieldNames(name, missing));

module.exports = { fieldNames, useLiveFields };
