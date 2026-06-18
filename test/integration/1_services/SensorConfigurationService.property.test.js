/* eslint-disable func-names */
const should = require('should');
const sinon = require('sinon');
const fc = require('fast-check');
const SubstanceService = require('../../../api/services/SubstanceService');
const {
  validateSubstance,
} = require('../../../api/services/SensorConfigurationService');

describe('SensorConfigurationService - validateSubstance', () => {
  describe('Property 1: Valid idSubstance accepted for substance-requiring QKs', () => {
    /**
     * Validates: Requirements 9.1
     *
     * For any non-null idSubstance that references an existing substance
     * with a substance-requiring QK code ("Concentration" or "IsotopeDelta"),
     * validateSubstance returns { error: null, substance: <object> }.
     */
    it('should return substance object for valid idSubstance with Concentration/IsotopeDelta', function () {
      this.timeout(10000);
      const fakeSubstance = { id: 1, name: 'Nitrate', formula: 'NO3-' };
      const stub = sinon
        .stub(SubstanceService, 'findById')
        .resolves(fakeSubstance);

      return fc
        .assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 10000 }),
            fc.constantFrom('Concentration', 'IsotopeDelta'),
            async (idSubstance, code) => {
              const result = await validateSubstance(idSubstance, code);
              should(result.error).be.null();
              should(result.substance).deepEqual(fakeSubstance);
            }
          ),
          { numRuns: 100 }
        )
        .finally(() => stub.restore());
    });
  });

  describe('Property 2: Null idSubstance rejected for substance-requiring QKs', () => {
    /**
     * Validates: Requirements 9.3
     *
     * For null/undefined idSubstance with "Concentration" or "IsotopeDelta",
     * validateSubstance returns an error.
     */
    it('should return an error for null idSubstance with Concentration/IsotopeDelta', function () {
      this.timeout(10000);
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom(null, undefined),
          fc.constantFrom('Concentration', 'IsotopeDelta'),
          async (idSubstance, code) => {
            const result = await validateSubstance(idSubstance, code);
            should(result.error).be.a.String();
            should(result.error).not.be.empty();
            should(result.substance).be.null();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Non-null idSubstance rejected for non-substance-requiring QKs', () => {
    /**
     * Validates: Requirements 9.4
     *
     * For any non-null idSubstance with a QK code that is NOT
     * "Concentration" or "IsotopeDelta", validateSubstance returns an error.
     */
    it('should return an error for non-null idSubstance with non-substance QK codes', function () {
      this.timeout(10000);
      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter(
              (code) => code !== 'Concentration' && code !== 'IsotopeDelta'
            ),
          async (idSubstance, code) => {
            const result = await validateSubstance(idSubstance, code);
            should(result.error).be.a.String();
            should(result.error).not.be.empty();
            should(result.substance).be.null();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Non-existent idSubstance always returns error', () => {
    /**
     * Validates: Requirements 9.2
     *
     * For any idSubstance that does not exist in t_substance,
     * validateSubstance returns an error regardless of quantity kind.
     */
    it('should return an error when idSubstance references a non-existent substance', function () {
      this.timeout(10000);
      const stub = sinon.stub(SubstanceService, 'findById').resolves(null);

      return fc
        .assert(
          fc.asyncProperty(
            fc.integer({ min: 1, max: 10000 }),
            fc.constantFrom('Concentration', 'IsotopeDelta'),
            async (idSubstance, code) => {
              const result = await validateSubstance(idSubstance, code);
              should(result.error).be.a.String();
              should(result.error).containEql('does not exist');
              should(result.substance).be.null();
            }
          ),
          { numRuns: 100 }
        )
        .finally(() => stub.restore());
    });
  });
});
