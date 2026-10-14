const {
  ORGANIZATION_TYPE_VALUES,
} = require('../../config/constants/organization');

/**
 * Validates an organization type sent by a client. A type can be omitted
 * (undefined), in which case the caller decides what that means, but never
 * cleared: null is rejected like any value outside the controlled list.
 * Returns an error message if invalid, or null if valid.
 *
 * @param {*} type - The type to validate
 * @returns {string|null} Error message or null
 */
const validateOrganizationType = (type) => {
  if (type === undefined || ORGANIZATION_TYPE_VALUES.includes(type)) {
    return null;
  }
  return `Invalid organization type ${JSON.stringify(type)}: it must be one of ${ORGANIZATION_TYPE_VALUES.join(', ')}.`;
};

module.exports = { validateOrganizationType };
