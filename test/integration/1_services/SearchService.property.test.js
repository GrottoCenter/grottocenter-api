/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const SearchService = require('../../../api/services/SearchService');
const typesense = require('../../../config/typesense');

const { allEntities, allEntitiesKeys } = SearchService;

/**
 * Helper: get all field names for an entity's schema
 */
function getFieldNames(entityName) {
  return allEntities[entityName].schema.fields.map((f) => f.name);
}

// Typesense types that are sortable by default (no explicit sort: true needed)
const SORTABLE_BY_DEFAULT_TYPES = [
  'int32',
  'int64',
  'float',
  'bool',
  'int32[]',
  'int64[]',
  'float[]',
  'bool[]',
];

/**
 * Helper: get sortable field names for an entity's schema.
 * Numeric and boolean fields are sortable by default in Typesense;
 * string fields require explicit `sort: true`.
 */
function getSortableFieldNames(entityName) {
  return allEntities[entityName].schema.fields
    .filter(
      (f) => f.sort === true || SORTABLE_BY_DEFAULT_TYPES.includes(f.type)
    )
    .map((f) => f.name);
}

/**
 * Helper: get non-sortable field names.
 * Only string fields without `sort: true` are truly non-sortable.
 */
function getNonSortableFieldNames(entityName) {
  return allEntities[entityName].schema.fields
    .filter(
      (f) => f.sort !== true && !SORTABLE_BY_DEFAULT_TYPES.includes(f.type)
    )
    .map((f) => f.name);
}

// --- Arbitraries for bug condition inputs ---

// 1. Non-existent field with valid direction
// Prefix with 'zzz_' to guarantee the generated name cannot match any real field
const nonExistentFieldArb = fc
  .constantFrom(...allEntitiesKeys)
  .chain((entity) =>
    fc.stringMatching(/^[a-z]{2,15}$/).map((field) => ({
      entity,
      sort: `zzz_${field}:asc`,
      category: 'non-existent-field',
    }))
  );

// 2. Non-sortable field with valid direction
const nonSortableFieldArb = fc
  .constantFrom(...allEntitiesKeys)
  .filter((entity) => getNonSortableFieldNames(entity).length > 0)
  .chain((entity) => {
    const nonSortable = getNonSortableFieldNames(entity);
    return fc.constantFrom(...nonSortable).chain((field) =>
      fc.constantFrom('asc', 'desc').map((dir) => ({
        entity,
        sort: `${field}:${dir}`,
        category: 'non-sortable-field',
      }))
    );
  });

// 3. Invalid format — missing direction (no colon)
const missingDirectionArb = fc
  .constantFrom(...allEntitiesKeys)
  .chain((entity) => {
    const sortable = getSortableFieldNames(entity);
    if (sortable.length === 0) {
      // Fallback: use any field name
      const allFields = getFieldNames(entity);
      return fc.constantFrom(...allFields).map((field) => ({
        entity,
        sort: field,
        category: 'missing-direction',
      }));
    }
    return fc.constantFrom(...sortable).map((field) => ({
      entity,
      sort: field,
      category: 'missing-direction',
    }));
  });

// 4. Invalid direction (not asc/desc)
const invalidDirectionArb = fc
  .constantFrom(...allEntitiesKeys)
  .chain((entity) => {
    const sortable = getSortableFieldNames(entity);
    if (sortable.length === 0) {
      const allFields = getFieldNames(entity);
      return fc.constantFrom(...allFields).chain((field) =>
        fc
          .constantFrom('up', 'down', 'ascending', 'descending', 'ASC', 'DESC')
          .map((dir) => ({
            entity,
            sort: `${field}:${dir}`,
            category: 'invalid-direction',
          }))
      );
    }
    return fc.constantFrom(...sortable).chain((field) =>
      fc
        .constantFrom('up', 'down', 'ascending', 'descending', 'ASC', 'DESC')
        .map((dir) => ({
          entity,
          sort: `${field}:${dir}`,
          category: 'invalid-direction',
        }))
    );
  });

// Combined arbitrary covering all bug condition variants
const bugConditionArb = fc.oneof(
  nonExistentFieldArb,
  nonSortableFieldArb,
  missingDirectionArb,
  invalidDirectionArb
);

/**
 * Property 1: Invalid Sort — Typesense Rejects Invalid Sort Inputs
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 *
 * For any collectionSearch() input with an invalid sort parameter,
 * Typesense will reject the request. The sort is passed through to
 * Typesense without local validation.
 */
describe('SearchService - Property 1: Invalid Sort', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('Property 1: invalid sort inputs are passed to Typesense (no local validation)', function () {
    this.timeout(30000);
    return fc.assert(
      fc.asyncProperty(bugConditionArb, async (input) => {
        sinon.restore();
        // Stub typesense.search to reject with a 400 (simulating Typesense rejection)
        const searchStub = sinon
          .stub(typesense, 'search')
          .rejects(
            Object.assign(new Error('Bad sort field'), { httpStatus: 400 })
          );

        let threw = false;
        try {
          await SearchService.collectionSearch({
            query: 'test',
            entity: input.entity,
            sort: input.sort,
          });
        } catch (err) {
          threw = true;
        }

        // The call should reach Typesense (no local interception)
        should(searchStub.called).be.true(
          `Expected typesense.search to be called for entity="${input.entity}" sort="${input.sort}" (${input.category})`
        );

        // And the Typesense error should propagate
        should(threw).be.true(
          `Expected collectionSearch to throw for entity="${input.entity}" sort="${input.sort}" (${input.category})`
        );
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Preservation — Valid Sort and No-Sort Behavior Unchanged
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * These tests capture the current VALID behavior of collectionSearch()
 * so we can verify it is preserved after the fix.
 * All three properties MUST PASS on the unfixed code.
 */
describe('SearchService - Property 2: Preservation', () => {
  let searchStub;

  beforeEach(() => {
    searchStub = sinon.stub(typesense, 'search').resolves({ hits: [] });
  });

  afterEach(() => {
    sinon.restore();
  });

  /**
   * Property 2a — Valid sort preserved
   *
   * For all valid entity + sortable field + valid direction (asc/desc) combinations,
   * collectionSearch calls typesense.search with sort_by equal to
   * `${field}:${direction},_text_match:desc`.
   *
   * **Validates: Requirements 3.1**
   */
  it('Property 2a: valid sort inputs produce correct sort_by param', function () {
    this.timeout(30000);

    // Build arbitrary: pick random entity, then a sortable field from its schema,
    // then a valid direction
    const validSortArb = fc
      .constantFrom(...allEntitiesKeys)
      .chain((entity) => {
        const sortable = getSortableFieldNames(entity);
        if (sortable.length === 0) {
          return fc.constant(null);
        }
        return fc
          .constantFrom(...sortable)
          .chain((field) =>
            fc
              .constantFrom('asc', 'desc')
              .map((direction) => ({ entity, field, direction }))
          );
      })
      .filter((v) => v !== null);

    return fc.assert(
      fc.asyncProperty(validSortArb, async (input) => {
        searchStub.resetHistory();

        await SearchService.collectionSearch({
          query: 'test',
          entity: input.entity,
          sort: `${input.field}:${input.direction}`,
        });

        // typesense.search should have been called exactly once
        should(searchStub.calledOnce).be.true(
          `Expected typesense.search to be called once for entity="${input.entity}" sort="${input.field}:${input.direction}"`
        );

        // Verify sort_by param matches expected format
        const params = searchStub.getCall(0).args[1];
        should(params).have.property('sort_by');
        should(params.sort_by).equal(
          `${input.field}:${input.direction},_text_match:desc`,
          `Expected sort_by="${input.field}:${input.direction},_text_match:desc" for entity="${input.entity}"`
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2b — No-sort preserved
   *
   * For all valid entities with no sort param, collectionSearch calls
   * typesense.search without a sort_by key.
   *
   * **Validates: Requirements 3.2**
   */
  it('Property 2b: no-sort inputs omit sort_by param', function () {
    this.timeout(30000);

    const entityArb = fc.constantFrom(...allEntitiesKeys);

    return fc.assert(
      fc.asyncProperty(entityArb, async (entity) => {
        searchStub.resetHistory();

        await SearchService.collectionSearch({
          query: 'test',
          entity,
        });

        // typesense.search should have been called exactly once
        should(searchStub.calledOnce).be.true(
          `Expected typesense.search to be called once for entity="${entity}" with no sort`
        );

        // Verify sort_by is absent from params
        const params = searchStub.getCall(0).args[1];
        should(params).not.have.property(
          'sort_by',
          `Expected no sort_by param for entity="${entity}" when sort is not provided`
        );
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2c — Invalid entity preserved
   *
   * For entity names not in allEntitiesKeys, collectionSearch returns null
   * without calling typesense.search.
   *
   * **Validates: Requirements 3.3**
   */
  it('Property 2c: invalid entity returns null without calling Typesense', function () {
    this.timeout(30000);

    const invalidEntityArb = fc
      .string({ minLength: 1, maxLength: 30 })
      .filter((s) => !allEntitiesKeys.includes(s));

    return fc.assert(
      fc.asyncProperty(invalidEntityArb, async (entity) => {
        searchStub.resetHistory();

        const result = await SearchService.collectionSearch({
          query: 'test',
          entity,
        });

        // Should return null
        should(result).be.null();

        // typesense.search should NOT have been called
        should(searchStub.called).be.false();
      }),
      { numRuns: 100 }
    );
  });
});
