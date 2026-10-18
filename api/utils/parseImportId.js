/* global BigInt */ // es6 env predates BigInt; Node >= 24 has it
/**
 * Parse the external id of a CSV import row (`id` column, stored in
 * `id_db_import`).
 *
 * Accepts a non-negative integer, as a JS number or as a string of decimal
 * digits, that does not exceed `max`. Anything else — blank, padded, signed,
 * decimal, non-numeric or out of range —
 * returns null, so that callers can report the row instead of letting
 * PostgreSQL reject the value (22003 / 22P02).
 *
 * @param {*} value
 * @param {bigint} max - Upper bound of the target column (MAX_PG_INTEGER or MAX_PG_BIGINT)
 * @returns {string|null} canonical decimal string (no leading zeros), or null
 */
const MAX_PG_INTEGER = 2147483647n;
const MAX_PG_BIGINT = 9223372036854775807n;

const parseImportId = (value, max) => {
  let digits;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) return null;
    digits = String(value);
  } else if (typeof value === 'string') {
    digits = value;
    if (!/^\d+$/.test(digits)) return null;
  } else {
    return null;
  }

  const id = BigInt(digits);
  return id <= max ? id.toString() : null;
};

const invalidImportIdMessage = (value, max) =>
  `Invalid id ${JSON.stringify(value)}: expected an integer between 0 and ${max}.`;

module.exports = parseImportId;
module.exports.invalidImportIdMessage = invalidImportIdMessage;
module.exports.MAX_PG_INTEGER = MAX_PG_INTEGER;
module.exports.MAX_PG_BIGINT = MAX_PG_BIGINT;
