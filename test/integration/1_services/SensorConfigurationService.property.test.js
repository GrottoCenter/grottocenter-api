/* eslint-disable func-names */
const should = require('should');
const fc = require('fast-check');
const {
  validateSubstance,
} = require('../../../api/services/SensorConfigurationService');

describe('SensorConfigurationService - validateSubstance', () => {
  describe('Property 1: Valid substances are accepted for substance-requiring QKs', () => {
    /**
     * Validates: Requirements 1.3, 3.1, 4.1
     *
     * For any valid substance string (1–100 chars, not purely whitespace) with a
     * substance-requiring QK code ("Concentration" or "IsotopeDelta"),
     * validateSubstance returns null (valid).
     */
    it('should return null for valid substance strings with Concentration/IsotopeDelta', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          fc.constantFrom('Concentration', 'IsotopeDelta'),
          (substance, code) => {
            const result = validateSubstance(substance, code);
            should(result).be.null();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Blank/missing substance rejected for substance-requiring QKs', () => {
    /**
     * Validates: Requirements 3.4
     *
     * For any string that is empty, undefined, null, or composed entirely of whitespace,
     * calling validateSubstance with "Concentration" or "IsotopeDelta" returns an error message.
     */
    it('should return an error for blank/missing substance with Concentration/IsotopeDelta', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, '', '   ', '\t', '\n'),
          fc.constantFrom('Concentration', 'IsotopeDelta'),
          (substance, code) => {
            const result = validateSubstance(substance, code);
            should(result).be.a.String();
            should(result).not.be.empty();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Non-null substance rejected for non-substance-requiring QKs', () => {
    /**
     * Validates: Requirements 3.5, 4.6
     *
     * For any non-null substance string and any quantity kind code that is NOT
     * "Concentration" or "IsotopeDelta", validateSubstance returns an error message.
     */
    it('should return an error for non-null substance with non-substance QK codes', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter(
              (code) => code !== 'Concentration' && code !== 'IsotopeDelta'
            ),
          (substance, code) => {
            const result = validateSubstance(substance, code);
            should(result).be.a.String();
            should(result).not.be.empty();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Substance exceeding 100 chars is always rejected', () => {
    /**
     * For any substance string longer than 100 characters, validateSubstance
     * returns an error message regardless of the quantity kind code.
     */
    it('should return an error for substance > 100 chars regardless of QK code', function () {
      this.timeout(10000);
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (substance, code) => {
            const result = validateSubstance(substance, code);
            should(result).be.a.String();
            should(result).containEql('100 characters');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
