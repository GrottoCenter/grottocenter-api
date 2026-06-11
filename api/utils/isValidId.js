/**
 * Returns true if the value is a positive integer within PostgreSQL's
 * 32-bit signed integer range (1–2147483647).
 *
 * Unlike the policy-level `validateId` (which coerces strings from route
 * params), this function requires the value to already be a JS number —
 * suitable for validating parsed JSON bodies where type matters.
 *
 * @param {*} val
 * @returns {boolean}
 */
const MAX_PG_INTEGER = 2147483647;

const isValidId = (val) =>
  typeof val === 'number' &&
  Number.isInteger(val) &&
  val >= 1 &&
  val <= MAX_PG_INTEGER;

module.exports = isValidId;
