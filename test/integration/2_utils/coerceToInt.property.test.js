const should = require('should');
const fc = require('fast-check');

/**
 * Property 1: Rounding Behavior — Decimal Values Are Rounded to Nearest Integer
 *
 * For all finite double values with a fractional part, coerceToInt(v) should
 * equal Math.round(v) and the result should be an integer.
 */

const coerceToInt = require('../../../api/utils/coerceToInt');

describe('coerceToInt - Property: Rounding Behavior', () => {
  describe('Property 1: Decimal values are rounded to nearest integer', () => {
    it('should round all finite decimal values to the nearest integer', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc
            .double({ noNaN: true, noDefaultInfinity: true })
            .filter((v) => v !== Math.round(v)),
          (v) => {
            const result = coerceToInt(v);
            should(result).equal(
              Math.round(v),
              `coerceToInt(${v}) should be ${Math.round(v)} but got ${result}`
            );
            should(Number.isInteger(result)).be.true(
              `coerceToInt(${v}) should be an integer but got ${result}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should round numeric strings with decimals to the nearest integer', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc
            .double({ noNaN: true, noDefaultInfinity: true })
            .filter((v) => v !== Math.round(v))
            .map((v) => String(v)),
          (s) => {
            const result = coerceToInt(s);
            should(result).equal(
              Math.round(parseFloat(s)),
              `coerceToInt('${s}') should be ${Math.round(parseFloat(s))} but got ${result}`
            );
            should(Number.isInteger(result)).be.true(
              `coerceToInt('${s}') should be an integer but got ${result}`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
