/**
 * Strict boolean parsing for request parameters.
 *
 * Accepted encodings:
 * - JSON booleans `true` / `false` (request bodies)
 * - the strings `'true'` / `'false'` (query strings, and clients that
 *   stringify their bodies)
 * - the strings `'1'` / `'0'` (the web client sends `?isPermanent=1`)
 *
 * `undefined`, `null` and `''` mean the parameter was not provided: a bare
 * `?isPermanent=` arrives as `''`, and no boolean column written from a
 * request accepts NULL. Anything else — `'yes'`, `'TRUE'`, numbers, objects —
 * is invalid rather than silently coerced, so a caller can tell a typo from a
 * deliberate `false`.
 */

const INVALID = Symbol('parseBool.INVALID');

const TRUE_VALUES = new Set([true, 'true', '1']);
const FALSE_VALUES = new Set([false, 'false', '0']);

/**
 * @param {*} value
 * @returns {boolean | undefined | symbol} the boolean, `undefined` when the
 *   value is absent, or `parseBool.INVALID`
 */
const parseBool = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (TRUE_VALUES.has(value)) return true;
  if (FALSE_VALUES.has(value)) return false;
  return INVALID;
};

parseBool.INVALID = INVALID;

module.exports = parseBool;
