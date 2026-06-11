const should = require('should');
const fc = require('fast-check');
const isValidId = require('../../../api/utils/isValidId');

const MAX_PG_INTEGER = 2147483647;

describe('isValidId - Property: accepts integers in [1, 2147483647]', () => {
  it('should return true for any integer in the valid range', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: MAX_PG_INTEGER }), (n) => {
        should(isValidId(n)).be.true();
      }),
      { numRuns: 500 }
    );
  });
});

describe('isValidId - Property: rejects integers outside [1, 2147483647]', () => {
  it('should return false for zero and negative integers', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000000000, max: 0 }), (n) => {
        should(isValidId(n)).be.false();
      }),
      { numRuns: 200 }
    );
  });

  it('should return false for integers above the maximum', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_PG_INTEGER + 1, max: Number.MAX_SAFE_INTEGER }),
        (n) => {
          should(isValidId(n)).be.false();
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('isValidId - Property: rejects non-integer numbers', () => {
  it('should return false for floating-point numbers', () => {
    const floatArb = fc
      .double({
        noNaN: true,
        noDefaultInfinity: true,
        min: 1,
        max: MAX_PG_INTEGER,
      })
      .filter((n) => !Number.isInteger(n));

    fc.assert(
      fc.property(floatArb, (n) => {
        should(isValidId(n)).be.false();
      }),
      { numRuns: 200 }
    );
  });

  it('should return false for NaN and Infinity', () => {
    fc.assert(
      fc.property(fc.constantFrom(NaN, Infinity, -Infinity), (val) => {
        should(isValidId(val)).be.false();
      }),
      { numRuns: 10 }
    );
  });
});

describe('isValidId - Property: rejects non-number types', () => {
  it('should return false for strings, booleans, objects, null, and undefined', () => {
    const nonNumberArb = fc.oneof(
      fc.string(),
      fc.boolean(),
      fc.object(),
      fc.constant(null),
      fc.constant(undefined),
      fc.array(fc.anything())
    );

    fc.assert(
      fc.property(nonNumberArb, (val) => {
        should(isValidId(val)).be.false();
      }),
      { numRuns: 200 }
    );
  });

  it('should return false for numeric strings that would be valid if coerced', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: MAX_PG_INTEGER }), (n) => {
        should(isValidId(String(n))).be.false();
      }),
      { numRuns: 100 }
    );
  });
});
