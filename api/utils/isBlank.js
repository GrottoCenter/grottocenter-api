/**
 * Returns true if the value is undefined, null, or a string containing only
 * whitespace (including the empty string).
 *
 * Non-string truthy values (numbers, objects, arrays) are NOT considered blank.
 *
 * @param {*} val
 * @returns {boolean}
 */
const isNonBlankString = require('./isNonBlankString');

const isBlank = (val) =>
  val === undefined ||
  val === null ||
  (typeof val === 'string' && !isNonBlankString(val));

module.exports = isBlank;
