const should = require('should');
const {
  POSTAL_CODE_MAX_LENGTH,
  validatePostalCodeLength,
} = require('../../../api/utils/postalCodeValidation');

describe('postalCodeValidation', () => {
  describe('validatePostalCodeLength', () => {
    it('should expose the TGrotto.postalCode maxLength', () => {
      should(POSTAL_CODE_MAX_LENGTH).equal(10);
    });

    it('should return null for a short postal code', () => {
      should(validatePostalCodeLength('84000')).be.null();
    });

    it('should return null for a postal code at exactly the limit', () => {
      should(validatePostalCodeLength('1234567890')).be.null();
    });

    // Value reported in https://github.com/GrottoCenter/grottocenter-api/issues/1774
    it('should return an error message for a too long postal code', () => {
      const result = validatePostalCodeLength('4400 Flémalle');
      should(result).be.a.String();
      should(result).containEql('Postal code');
      should(result).containEql('exceeds maximum length of 10');
      should(result).containEql('got 13');
      should(result).containEql('3 over limit');
    });

    it('should return null for null, undefined, empty string and non-string values', () => {
      should(validatePostalCodeLength(null)).be.null();
      should(validatePostalCodeLength(undefined)).be.null();
      should(validatePostalCodeLength('')).be.null();
      should(validatePostalCodeLength(84000)).be.null();
    });
  });
});
