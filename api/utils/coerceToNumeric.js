/**
 * Coerce a value for a numeric (decimal) database column.
 * Converts empty strings to null so PostgreSQL doesn't choke on ''.
 * Passes through null, undefined, and any other value unchanged
 * (letting Waterline / the DB adapter handle further validation).
 *
 * @param {*} value
 * @returns {*} null for empty strings, original value otherwise
 */
const coerceToNumeric = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
};

module.exports = coerceToNumeric;
