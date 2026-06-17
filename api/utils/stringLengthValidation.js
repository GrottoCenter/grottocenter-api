/**
 * Generic string length validation utility.
 *
 * Validates string fields against maxLength constraints, typically derived
 * from Waterline model definitions. This prevents 500 errors from ORM-level
 * validation by catching length violations early (at the controller or
 * service layer) and surfacing them as 400 Bad Request responses.
 *
 * Usage:
 *   const { validateStringLengths } = require('../../utils/stringLengthValidation');
 *
 *   const errors = validateStringLengths({
 *     name: { value: req.body.name, maxLength: 300 },
 *     url: { value: req.body.url, maxLength: 500 },
 *   });
 *
 *   if (errors.length > 0) {
 *     return res.badRequest({ errors });
 *   }
 */

/**
 * Validates a single string value against a maximum length.
 *
 * @param {string} fieldName - Human-readable field name for the error message
 * @param {*} value - The value to validate (skipped if null/undefined/non-string)
 * @param {number} maxLength - Maximum allowed character count
 * @returns {{ field: string, message: string }|null} Error object or null if valid
 */
const validateStringLength = (fieldName, value, maxLength) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  if (value.length <= maxLength) return null;

  const excess = value.length - maxLength;
  return {
    field: fieldName,
    message: `${fieldName} exceeds maximum length of ${maxLength} characters (got ${value.length}, ${excess} over limit).`,
  };
};

/**
 * Validates multiple string fields against their maximum lengths.
 *
 * @param {Object<string, { value: *, maxLength: number }>} fieldMap
 *   Keys are field names, values are objects with `value` and `maxLength`.
 * @returns {Array<{ field: string, message: string }>} Array of error objects (empty = all valid)
 */
const validateStringLengths = (fieldMap) => {
  const errors = [];
  for (const [fieldName, { value, maxLength }] of Object.entries(fieldMap)) {
    const error = validateStringLength(fieldName, value, maxLength);
    if (error) {
      errors.push(error);
    }
  }
  return errors;
};

module.exports = { validateStringLength, validateStringLengths };
