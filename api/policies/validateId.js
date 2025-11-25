/**
 * validateId
 *
 * @module      :: Policy
 * @description :: Validates that the 'id' parameter is a positive integer.
 *                 Prevents Waterline errors when ID is 0 or negative.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = (req, res, next) => {
  const id = Number(req.params.id || req.param('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return res.notFound(`Invalid ID: ${req.params.id || req.param('id')}`);
  }
  return next();
};
