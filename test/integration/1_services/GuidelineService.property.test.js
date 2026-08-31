/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const {
  extractCountryId,
} = require('../../../api/services/mapping/converters');
const { validateMassifIds } = require('../../../api/services/GuidelineService');

/**
 * Property 1: extractCountryId returns the country prefix for any valid ISO 3166-2 code
 *
 * For any string matching the ISO 3166-2 pattern (e.g. "FR-01", "US-CA"),
 * extractCountryId must return the part before the first '-'.
 *
 * Validates: Requirements 2.9
 */
describe('extractCountryId - Property 1: ISO 3166-2 prefix extraction', () => {
  it('extractCountryId returns the country prefix for any valid ISO 3166-2 code', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(fc.stringMatching(/^[A-Z]{2,3}-[A-Z0-9]+$/), (code) => {
        const result = extractCountryId(code);
        const expected = code.slice(0, code.indexOf('-'));
        should(result).equal(expected);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: extractCountryId returns null for null, non-strings, and strings without a dash
 *
 * For hostile inputs (null, integers, and arbitrary strings which may or may
 * not contain a '-'), extractCountryId must return null whenever the input is
 * not a string or does not contain a '-' at position > 0.
 *
 * Validates: Requirements 2.9
 */
describe('extractCountryId - Property 2: hostile inputs return null', () => {
  it('extractCountryId returns null for null, non-strings, and strings without a dash', function () {
    this.timeout(30000);
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), fc.integer(), fc.string()),
        (input) => {
          // For this property we only assert null when input is not a valid
          // ISO 3166-2 string (i.e. not a string, or a string with no '-', or
          // '-' at position 0).
          if (
            input === null ||
            typeof input !== 'string' ||
            input.indexOf('-') <= 0
          ) {
            const result = extractCountryId(input);
            should(result).be.null();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: validateMassifIds returns true for arrays of positive finite numbers
 *
 * For any array whose every element is a positive finite number (> 0, not NaN,
 * not Infinity), validateMassifIds must return true.
 *
 * Validates: Requirements 3.3
 */
describe('validateMassifIds - Property 3: positive finite arrays return true', () => {
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
 * Property 4: validateMassifIds returns false when any element is non-positive or non-finite
 *
 * For any array that contains at least one invalid value (0, -1, NaN,
 * Infinity, or -Infinity), validateMassifIds must return false.
 *
 * Validates: Requirements 3.3
 */
describe('validateMassifIds - Property 4: array with any invalid element returns false', () => {
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
