/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const {
  extractCountryId,
} = require('../../../api/services/mapping/converters');

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
