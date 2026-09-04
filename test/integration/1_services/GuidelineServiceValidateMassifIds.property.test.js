/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const { validateMassifIds } = require('../../../api/services/GuidelineService');

/**
 * Property-based coverage for GuidelineService.validateMassifIds.
 *
 * This validator predates the guideline geo/RBAC changes and its behavior is
 * unchanged by them; it lives in its own file so it is not read as part of
 * that change set.
 */

/**
 * Property 1: validateMassifIds returns true for arrays of positive finite numbers
 *
 * For any array whose every element is a positive finite number (> 0, not NaN,
 * not Infinity), validateMassifIds must return true.
 */
describe('validateMassifIds - Property 1: positive finite arrays return true', () => {
  it('validateMassifIds returns true for arrays of positive finite numbers', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(
        fc.array(
          fc.float({
            min: Math.fround(0.001),
            max: Math.fround(9999),
            noNaN: true,
          })
        ),
        (arr) => {
          const result = validateMassifIds(arr);
          should(result).be.true();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: validateMassifIds returns false when any element is non-positive or non-finite
 *
 * For any array that contains at least one invalid value (0, -1, NaN,
 * Infinity, or -Infinity), validateMassifIds must return false.
 */
describe('validateMassifIds - Property 2: array with any invalid element returns false', () => {
  it('validateMassifIds returns false when any element is non-positive or non-finite', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(
        fc
          .tuple(
            fc.array(
              fc.float({
                min: Math.fround(0.001),
                max: Math.fround(9999),
                noNaN: true,
              })
            ),
            fc.oneof(
              fc.constant(0),
              fc.constant(-1),
              fc.constant(NaN),
              fc.constant(Infinity)
            )
          )
          .map(([valid, invalid]) => [...valid, invalid]),
        (arr) => {
          const result = validateMassifIds(arr);
          should(result).be.false();
        }
      ),
      { numRuns: 100 }
    );
  });
});
