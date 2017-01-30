/**
 *GrottoController
 *
 * @description :: Server-side logic for managing entries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
'use strict';
module.exports = {
  find: function(req, res) {
    TGrotto.findOneById(req.params.id).populate('author').exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'GrottoController.find';
      params.notFoundMessage = 'Grotto of id ' + req.params.id + ' not found.';
      return ControllerService.treat(err, found, params, res);
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
      return ControllerService.treat(err, found, params, res);
    });
  }
};
