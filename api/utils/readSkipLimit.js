const LIMIT_DEFAULT = 50;
const LIMIT_MAX = 100;

const toInt = (value, fallback) => {
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? fallback : num;
};

/**
 * Read the `skip` and `limit` pagination parameters of a collection.
 *
 * Lenient on purpose, like the organizations list it was taken from: a
 * missing or non-numeric value falls back to its default (skip 0, limit 50),
 * a negative skip is raised to 0, and the limit is kept between 1 and 100.
 *
 * @param {*} rawSkip `req.param('skip')`
 * @param {*} rawLimit `req.param('limit')`
 * @returns {{ skip: number, limit: number }}
 */
const readSkipLimit = (rawSkip, rawLimit) => ({
  skip: Math.max(toInt(rawSkip, 0), 0),
  limit: Math.max(Math.min(toInt(rawLimit, LIMIT_DEFAULT), LIMIT_MAX), 1),
});

readSkipLimit.LIMIT_DEFAULT = LIMIT_DEFAULT;
readSkipLimit.LIMIT_MAX = LIMIT_MAX;

module.exports = readSkipLimit;
