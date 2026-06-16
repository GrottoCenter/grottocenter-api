/**
 * Trim a string value if non-null/undefined, otherwise return the value as-is.
 * Useful for sanitizing user-provided string fields before persistence.
 */
const trimIfString = (value) =>
  typeof value === 'string' ? value.trim() : value;

module.exports = trimIfString;
