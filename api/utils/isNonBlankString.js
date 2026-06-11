/**
 * Returns true if the value is a string with at least one non-whitespace
 * character. Useful for checking optional text fields that, when provided,
 * must contain meaningful content.
 *
 * @param {*} val
 * @returns {boolean}
 */
const isNonBlankString = (val) =>
  typeof val === 'string' && val.trim().length > 0;

module.exports = isNonBlankString;
