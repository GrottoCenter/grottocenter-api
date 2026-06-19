const { validateStringLength } = require('./stringLengthValidation');

const NAME_MAX_LENGTH = 200; // TName.name maxLength

/**
 * Validates that a name string does not exceed the DB column limit.
 * Returns an error message if invalid, or null if valid.
 *
 * @param {string} name - The name text to validate
 * @returns {string|null} Error message or null
 */
const validateNameLength = (name) => {
  const error = validateStringLength('Name', name, NAME_MAX_LENGTH);
  return error ? error.message : null;
};

module.exports = { NAME_MAX_LENGTH, validateNameLength };
