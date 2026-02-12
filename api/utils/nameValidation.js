const NAME_MAX_LENGTH = 200;

/**
 * Validates that a name string does not exceed the DB column limit.
 * Returns an error message if invalid, or null if valid.
 *
 * @param {string} name - The name text to validate
 * @returns {string|null} Error message or null
 */
const validateNameLength = (name) => {
  if (name && name.length > NAME_MAX_LENGTH) {
    return `Name is too long (${name.length} characters). Maximum is ${NAME_MAX_LENGTH}.`;
  }
  return null;
};

module.exports = { NAME_MAX_LENGTH, validateNameLength };
