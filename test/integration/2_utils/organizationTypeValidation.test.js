const should = require('should');
const {
  ORGANIZATION_TYPE_VALUES,
} = require('../../../config/constants/organization');
const {
  validateOrganizationType,
} = require('../../../api/utils/organizationTypeValidation');

describe('organizationTypeValidation', () => {
  describe('validateOrganizationType', () => {
    it('should accept every type of the controlled list', () => {
      for (const type of ORGANIZATION_TYPE_VALUES) {
        should(validateOrganizationType(type)).be.null();
      }
    });

    it('should accept an omitted type when it is not required', () => {
      should(validateOrganizationType(undefined)).be.null();
    });

    it('should reject an omitted type when it is required', () => {
      const result = validateOrganizationType(undefined, { required: true });
      should(result).containEql('You must provide the organization type');
      should(result).containEql(ORGANIZATION_TYPE_VALUES.join(', '));
    });

    it('should accept a type of the list when it is required', () => {
      should(validateOrganizationType('LIBRARY', { required: true })).be.null();
    });

    // https://github.com/GrottoCenter/grottocenter-api/issues/1923
    it('should accept OTHER, optional or required', () => {
      should(validateOrganizationType('OTHER')).be.null();
      should(validateOrganizationType('OTHER', { required: true })).be.null();
    });

    it('should reject null, since a type cannot be cleared', () => {
      should(validateOrganizationType(null)).containEql('null');
      should(validateOrganizationType(null, { required: true })).containEql(
        'Invalid organization type'
      );
    });

    it('should reject an unknown type and list the allowed ones', () => {
      const result = validateOrganizationType('FAN_CLUB');
      should(result).containEql('"FAN_CLUB"');
      should(result).containEql(ORGANIZATION_TYPE_VALUES.join(', '));
    });

    it('should reject a type in the wrong case', () => {
      should(validateOrganizationType('speleology')).be.a.String();
    });

    it('should reject a type that is not a string', () => {
      should(validateOrganizationType(['SPELEOLOGY'])).be.a.String();
    });
  });
});
