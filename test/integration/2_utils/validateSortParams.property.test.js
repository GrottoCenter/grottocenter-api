/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const {
  SORTABLE_COLUMNS,
  SORTABLE_COLUMNS_COUNTRY,
  VALID_ORDERS,
  VALIDATION_ERROR,
  validateSortParams,
} = require('../../../api/utils/validateSortParams');
const CommonService = require('../../../api/services/CommonService');
const DataQualityComputeService = require('../../../api/services/DataQualityComputeService');

// --- Shared arbitraries ---

// Any column from the allow-list
const sortableColumnArb = fc.constantFrom(...SORTABLE_COLUMNS);

// Any valid order direction
const validOrderArb = fc.constantFrom('asc', 'desc');

// Optional order: either a valid direction or undefined (to test default)
const optionalOrderArb = fc.oneof(validOrderArb, fc.constant(undefined));

// Arbitrary string that is NOT in the allow-list.
// Filter out any accidental match against SORTABLE_COLUMNS (case-insensitive).
const invalidColumnArb = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter((s) => !SORTABLE_COLUMNS.includes(s.toLowerCase()));

// Arbitrary string that is NOT 'asc' or 'desc' (case-insensitive).
const invalidOrderArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !VALID_ORDERS.includes(s.toLowerCase()));

// --- Helpers ---

function mockReqRes(sortVal, orderVal) {
  const req = {
    param: sinon.stub(),
  };
  req.param.withArgs('sort').returns(sortVal);
  req.param.withArgs('order').returns(orderVal);

  const res = {
    badRequest: sinon.spy(),
  };
  return { req, res };
}

/**
 * Property 1: Valid sort parameters produce correct ORDER BY clause
 *
 * For any column from SORTABLE_COLUMNS and any valid order direction (asc,
 * desc, or omitted — defaulting to asc), the SQL query string built by
 * DataQualityComputeService.getEntrancesWithQualityByMassif contains an
 * ORDER BY <column> <DIRECTION> clause positioned before the LIMIT clause.
 *
 * Validates: Requirements 1.1, 2.1, 2.2, 2.3
 */
describe('validateSortParams - Property 1: Valid sort parameters produce correct ORDER BY clause', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should produce ORDER BY <column> <direction> before LIMIT for any valid sort/order', function () {
    this.timeout(30000);
    return fc.assert(
      fc.asyncProperty(
        sortableColumnArb,
        optionalOrderArb,
        async (column, order) => {
          const effectiveOrder = order || 'asc';

          let capturedSql = null;
          const stub = sinon.stub(CommonService, 'query').callsFake((sql) => {
            capturedSql = sql;
            return Promise.resolve({ rows: [] });
          });

          try {
            await DataQualityComputeService.getEntrancesWithQualityByMassif(
              1,
              50,
              0,
              column,
              effectiveOrder
            );

            should(capturedSql).be.a.String();

            const expectedFragment = `ORDER BY ${column} ${effectiveOrder.toUpperCase()}`;
            should(capturedSql).containEql(expectedFragment);

            // ORDER BY must appear before LIMIT
            const orderByIdx = capturedSql.indexOf('ORDER BY');
            const limitIdx = capturedSql.indexOf('LIMIT');
            should(orderByIdx).be.above(-1);
            should(limitIdx).be.above(-1);
            should(orderByIdx).be.below(limitIdx);
          } finally {
            stub.restore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Invalid sort column rejection
 *
 * For any arbitrary string not in the allow-list, validateSortParams returns
 * VALIDATION_ERROR and the string never appears in any SQL query.
 *
 * Validates: Requirements 3.1, 4.1
 */
describe('validateSortParams - Property 2: Invalid sort column rejection', () => {
  it('should reject any sort column not in the allow-list', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(invalidColumnArb, (badColumn) => {
        const { req, res } = mockReqRes(badColumn, undefined);

        const result = validateSortParams(req, res);

        should(result).equal(VALIDATION_ERROR);
        should(res.badRequest.calledOnce).be.true();

        // The invalid column must not appear in any SQL-like context.
        // Verify the error message references the bad column but does not
        // construct an ORDER BY with it.
        const errorMsg = res.badRequest.firstCall.args[0];
        should(errorMsg).not.containEql(`ORDER BY ${badColumn}`);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Invalid order value rejection
 *
 * For any arbitrary string that is not 'asc' or 'desc' (case-insensitive),
 * validateSortParams returns VALIDATION_ERROR and the string never appears
 * in any SQL query.
 *
 * Validates: Requirements 3.2, 4.2
 */
describe('validateSortParams - Property 3: Invalid order value rejection', () => {
  it('should reject any order value that is not asc or desc', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(sortableColumnArb, invalidOrderArb, (column, badOrder) => {
        const { req, res } = mockReqRes(column, badOrder);

        const result = validateSortParams(req, res);

        should(result).equal(VALIDATION_ERROR);
        should(res.badRequest.calledOnce).be.true();

        // The invalid order must not appear in any SQL-like context.
        const errorMsg = res.badRequest.firstCall.args[0];
        should(errorMsg).not.containEql(`ORDER BY`);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Per-endpoint allow-list enforcement
 *
 * massif_name is valid in the full allow-list but rejected by the country
 * allow-list. This property verifies that the per-endpoint filtering works
 * correctly for any column that exists in SORTABLE_COLUMNS but not in
 * SORTABLE_COLUMNS_COUNTRY.
 */
describe('validateSortParams - Property 4: Per-endpoint allow-list enforcement', () => {
  it('should reject columns excluded from the country allow-list', function () {
    this.timeout(30000);
    const excludedColumns = SORTABLE_COLUMNS.filter(
      (c) => !SORTABLE_COLUMNS_COUNTRY.includes(c)
    );
    fc.assert(
      fc.property(
        fc.constantFrom(...excludedColumns),
        validOrderArb,
        (column, order) => {
          const { req, res } = mockReqRes(column, order);

          const result = validateSortParams(req, res, SORTABLE_COLUMNS_COUNTRY);

          should(result).equal(VALIDATION_ERROR);
          should(res.badRequest.calledOnce).be.true();
        }
      ),
      { numRuns: 50 }
    );
  });
});
