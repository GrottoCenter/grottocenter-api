/**
 * Strict parsing of a PDF page offset sent by a client (#1936).
 *
 * The offset maps a printed page number to its position in a PDF:
 * `PDF position = printed page number + offset`.
 *
 * - `undefined`: the offset was not sent, so a stored value is left unchanged.
 * - `null` or `''`: an explicit clear. Multipart bodies cannot carry a null,
 *   so an empty field stands for it.
 * - an integer, or an integer string (multipart bodies only carry strings),
 *   between -MAX and MAX: the offset. Zero is a configured offset.
 *
 * Anything else — fractions, exponents, whitespace, out-of-range values,
 * objects — is invalid rather than coerced.
 */

const INVALID = Symbol('parsePdfPageOffset.INVALID');

// Symmetric bound inside the integer column range.
const MAX = 2147483647;

const INTEGER_STRING = /^[+-]?\d+$/;

/**
 * @param {*} value
 * @returns {number | null | undefined | symbol} the offset, `null` for an
 *   explicit clear, `undefined` when absent, or `parsePdfPageOffset.INVALID`
 */
const parsePdfPageOffset = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  let n;
  if (typeof value === 'number') n = value;
  else if (typeof value === 'string' && INTEGER_STRING.test(value))
    n = Number(value);
  else return INVALID;
  if (!Number.isInteger(n) || n < -MAX || n > MAX) return INVALID;
  // '-0' parses to -0, which JSON would serialize as 0 anyway.
  return n === 0 ? 0 : n;
};

parsePdfPageOffset.INVALID = INVALID;
parsePdfPageOffset.MAX = MAX;

module.exports = parsePdfPageOffset;
