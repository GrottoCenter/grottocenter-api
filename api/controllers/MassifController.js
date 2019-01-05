/**
 * MassifController
 *
 * @description :: Server-side logic for managing massif
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

'use strict';
module.exports = {
  find: function (req, res, next, converter = MappingV1Service.convertToMassifModel) {
    TMassif.findOne({
      id: req.params.id,
    }).populate('author').populate('caves').exec(function (err, found) {
      let params = {};
      params.searchedItem = 'Massif of id ' + req.params.id;
      return ControllerService.treatAndConvert(req, err, found, params, res, converter);
    });
  },
};

