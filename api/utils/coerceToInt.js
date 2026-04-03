/**
 * Coerce a value to an integer via Math.round().
 * Handles both numbers and numeric strings (e.g. from CSV parsing).
 * Passes through null, undefined, non-finite, and non-numeric values unchanged
 * (letting Waterline handle validation for invalid types).
 *
 * @param {*} value
 * @returns {*} rounded integer for finite numbers/numeric strings, original value otherwise
 */
const coerceToInt = (value) => {
  if (value === null || value === undefined) return value;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof n === 'number' && Number.isFinite(n)) return Math.round(n);
  return value;
};

module.exports = coerceToInt;
