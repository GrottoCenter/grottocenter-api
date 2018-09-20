/**
 * paginate
 *
 * @module      :: Policy
 * @description :: Paginate data
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
  try {
    const askedRange = req.param('range');

    if (askedRange !== undefined) {
      const splitRange = askedRange.split('-');

      if (splitRange.length !== 2) {
        throw 'Invalid range';
      }

      if (!splitRange[0].match(/[0-9]+/) || !splitRange[1].match(/[0-9]+/)) {
        throw 'Invalid range';
      }

      const diffRange = parseInt(splitRange[1]) - parseInt(splitRange[0]);

      if (diffRange < 0 || diffRange > 10) { //  TODO dynamize
        throw 'Invalid range';
      }
    }

    next();
  } catch(e) {
    res.set('Accept-Range', 'search 10'); //  TODO dynamize
    return res.badRequest('Requested range not allowed');
  }
};