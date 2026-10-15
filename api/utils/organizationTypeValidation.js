const {
  ORGANIZATION_TYPE_VALUES,
} = require('../../config/constants/organization');

/**
 * Validates an organization type sent by a client. A type is never cleared:
 * null is rejected like any value outside the controlled list. An omitted type
 * (undefined) is rejected only when `required` is set, as on creation; on an
 * update it means "leave the type as is".
 * Returns an error message if invalid, or null if valid.
 *
 * @param {*} type - The type to validate
 * @param {object} [options]
 * @param {boolean} [options.required=false] - Reject an omitted type
 * @returns {string|null} Error message or null
 */
const validateOrganizationType = (type, { required = false } = {}) => {
  const allowed = ORGANIZATION_TYPE_VALUES.join(', ');
  if (type === undefined) {
    return required
      ? `You must provide the organization type: one of ${allowed}.`
      : null;
  }
  if (ORGANIZATION_TYPE_VALUES.includes(type)) return null;
  return `Invalid organization type ${JSON.stringify(type)}: it must be one of ${allowed}.`;
};

module.exports = { validateOrganizationType };
