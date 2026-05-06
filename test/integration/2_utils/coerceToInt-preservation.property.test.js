/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');

/**
 * Property 2: Preservation — Integer and Nullish Values Pass Through Unchanged
 *
 * Verifies that coerceToInt acts as an identity function for values that are
 * already integers, null, undefined, or non-finite (NaN, Infinity).
 */

const coerceToInt = require('../../../api/utils/coerceToInt');

describe('coerceToInt - Property: Preservation', () => {
  describe('Property 2a: Integer values pass through unchanged', () => {
    it('should return the same value for any integer', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(fc.integer(), (n) => {
          should(coerceToInt(n)).equal(n);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2b: Nullish values pass through unchanged', () => {
    it('should return null for null and undefined for undefined', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.oneof(fc.constant(null), fc.constant(undefined)),
          (v) => {
            should(coerceToInt(v)).equal(v);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2c: Non-finite values pass through unchanged', () => {
    it('should return NaN for NaN and Infinity for Infinity', () => {
      should(Number.isNaN(coerceToInt(NaN))).be.true();
      should(coerceToInt(Infinity)).equal(Infinity);
      should(coerceToInt(-Infinity)).equal(-Infinity);
    });
  });
});
