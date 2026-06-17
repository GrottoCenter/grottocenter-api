const should = require('should');
const {
  validateStringLength,
  validateStringLengths,
} = require('../../../api/utils/stringLengthValidation');

describe('stringLengthValidation', () => {
  describe('validateStringLength', () => {
    it('should return null for a string within the limit', () => {
      const result = validateStringLength('name', 'hello', 200);
      should(result).be.null();
    });

    it('should return null for a string at exactly the limit', () => {
      const result = validateStringLength('name', 'a'.repeat(200), 200);
      should(result).be.null();
    });

    it('should return an error object for a string exceeding the limit', () => {
      const result = validateStringLength('name', 'a'.repeat(201), 200);
      should(result).not.be.null();
      should(result).have.property('field', 'name');
      should(result.message).containEql('exceeds maximum length of 200');
      should(result.message).containEql('got 201');
      should(result.message).containEql('1 over limit');
    });

    it('should report correct excess in the error message', () => {
      const result = validateStringLength('title', 'x'.repeat(320), 300);
      should(result.message).containEql('20 over limit');
    });

    it('should return null for null values', () => {
      const result = validateStringLength('name', null, 200);
      should(result).be.null();
    });

    it('should return null for undefined values', () => {
      const result = validateStringLength('name', undefined, 200);
      should(result).be.null();
    });

    it('should return null for non-string values', () => {
      should(validateStringLength('num', 12345, 5)).be.null();
      should(validateStringLength('bool', true, 5)).be.null();
      should(validateStringLength('arr', [1, 2, 3], 5)).be.null();
    });

    it('should return null for an empty string', () => {
      const result = validateStringLength('name', '', 200);
      should(result).be.null();
    });
  });

  describe('validateStringLengths', () => {
    it('should return an empty array when all fields are valid', () => {
      const errors = validateStringLengths({
        name: { value: 'hello', maxLength: 200 },
        url: { value: 'https://example.com', maxLength: 500 },
      });
      should(errors).be.an.Array();
      should(errors).have.length(0);
    });

    it('should return errors for all fields exceeding their limits', () => {
      const errors = validateStringLengths({
        name: { value: 'a'.repeat(201), maxLength: 200 },
        url: { value: 'b'.repeat(501), maxLength: 500 },
      });
      should(errors).have.length(2);
      should(errors[0]).have.property('field', 'name');
      should(errors[1]).have.property('field', 'url');
    });

    it('should skip null and undefined values', () => {
      const errors = validateStringLengths({
        name: { value: null, maxLength: 200 },
        url: { value: undefined, maxLength: 500 },
      });
      should(errors).have.length(0);
    });

    it('should return errors only for fields that exceed limits', () => {
      const errors = validateStringLengths({
        name: { value: 'short', maxLength: 200 },
        url: { value: 'b'.repeat(501), maxLength: 500 },
        label: { value: null, maxLength: 100 },
      });
      should(errors).have.length(1);
      should(errors[0]).have.property('field', 'url');
    });
  });
});
