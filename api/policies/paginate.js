/**
 * paginate
 *
 * @module      :: Policy
 * @description :: Paginate data
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
const _ = require('underscore.string');

module.exports = function(req, res, next) {
  const apiControl = req.options.api;

  if (!apiControl) {
    sails.log.error('Asked route is not correctly configurated: missing api: {...}');
    return res.serverError('Misconfigurated route'); // TODO
  }

  try {
    const askedRange = req.param('range');

    if (askedRange !== undefined) {
      if (!askedRange.match(/[0-9]+-[0-9]+/)) {
        throw 'Invalid range';
      }

      const splitRange = askedRange.split('-');
      const diffRange = parseInt(splitRange[1]) - parseInt(splitRange[0]);

      if (diffRange < 0 || diffRange > apiControl.limit) {
        throw 'Invalid range';
      }
    }

    next();
  } catch(e) {
    res.set('Accept-Range', _.capitalize(apiControl.entity).concat(' ', apiControl.limit));
    return res.badRequest('Requested range not allowed');
  }
};