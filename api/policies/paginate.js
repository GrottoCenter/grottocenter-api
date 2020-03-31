/**
 * paginate
 *
 * @module      :: Policy
 * @description :: Paginate data
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
const _ = require('underscore.string');

module.exports = (req, res, next) => {
  const apiControl = req.options.api;

  if (!apiControl) {
    sails.log.error(
      `Asked route ${req.route.path} is not correctly configurated: missing block api: {...}`,
    );
    return res.serverError('Misconfigurated route'); // TODO
  }

  try {
    const askedRange = req.param('range');

    if (askedRange !== undefined) {
      if (!askedRange.match(/[0-9]+-[0-9]+/)) {
        throw new Error('Invalid range');
      }

      const splitRange = askedRange.split('-');
      const diffRange = parseInt(splitRange[1], 10) - parseInt(splitRange[0], 10);

      if (diffRange < 0 || diffRange > apiControl.limit) {
        throw new Error('Invalid range');
      }
    }

    return next();
  } catch (e) {
    res.set('Accept-Range', _.capitalize(apiControl.entity).concat(' ', apiControl.limit));
    return res.badRequest('Requested range not allowed');
  }
};
