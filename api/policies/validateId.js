/**
 * validateId
 *
 * @module      :: Policy
 * @description :: Validates that all integer ID parameters in the route are
 *                 positive integers within PostgreSQL's 32-bit integer range.
 *                 Prevents database adapter errors from out-of-range values.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
const MAX_PG_INTEGER = 2147483647;

const isValidId = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 && num <= MAX_PG_INTEGER;
};

module.exports = (req, res, next) => {
  // Validate all route params that look like IDs
  const params = req.params || {};
  const idParams = Object.entries(params).filter(
    ([k]) => k === 'id' || k.endsWith('Id')
  );

  for (const [, value] of idParams) {
    if (!isValidId(value)) {
      return res.notFound(`Invalid ID: ${value}`);
    }
  }

  // Fallback: also check req.param('id') for query-based IDs
  if (idParams.length === 0) {
    const id = req.param('id');
    if (id !== undefined && !isValidId(id)) {
      return res.notFound(`Invalid ID: ${id}`);
    }
  }

  return next();
};
