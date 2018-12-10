/**
 *GrottoController
 *
 * @description :: Server-side logic for managing entries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
'use strict';
module.exports = {
  find: function(req, res) {
    TGrotto.findOne({
      id: req.params.id,
    }).populate('cavers').populate('entries').exec(function(err, found) {
      let params = {};
      params.searchedItem = 'Grotto of id ' + req.params.id;
      return ControllerService.treatAndConvert(err, found, params, res, MappingV1Service.convertToGrottoModel);
    });
  },

  findAll: function(req, res) {
    let parameters = {};
    if (req.param('name') !== undefined) {
      parameters.name = {
        'like': '%' + req.param('name') + '%'
      };
    }
    if (req.param('region') !== undefined) {
      parameters.region = {
        'like': '%' + req.param('region') + '%'
      };
    }

    TGrotto.find(parameters).populate('author').sort('id ASC').limit(10).exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'GrottoController.findAll';
      params.notFoundMessage = 'No grottos found.';
      return ControllerService.treat(req, err, found, params, res);
    });
  },

  getOfficialPartnersNumber: function(req, res) {
    GrottoService.getOfficialPartnersNumber()
      .then(function(count) {
        if (!count) {
          return res.notFound('Problem while getting number of official partners.');
        }
        return res.json(count);
      })
      .catch(function(err) {
        sails.log.error(err);
        return res.serverError('GrottoController.getOfficialPartnersNumber error : ' + err);
      });
  },

  getPartnersNumber: function(req, res) {
    TGrotto.count().exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'GrottoController.getPartnersNumber';
      params.notFoundMessage = 'Problem while getting number of partners.';

      let count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  }
};
