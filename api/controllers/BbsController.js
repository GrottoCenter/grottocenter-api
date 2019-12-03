/**
 * BbsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

'use strict';
module.exports = {
  find: function (req, res, next, converter) {
    TBbs.findOne({
      id: req.params.id
    }).populate('country').populate('chapter').exec(function (err, found) {
      let params = {};
      params.controllerMethod = 'BbsController.find';
      params.searchedItem = 'BBS of id ' + req.params.id;
      return ControllerService.treatAndConvert(req, err, found, params, res, converter);
    });
  },

  count: function (req, res) {
    TBbs.count().exec(function (err, found) {
      let params = {};
      params.controllerMethod = 'BbsController.count';
      params.notFoundMessage = 'Problem while getting number of bbs.';

      let count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  }
};
