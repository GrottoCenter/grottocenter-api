/**
 * CaveController
 *
 * @description :: Server-side logic for managing Caves
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
'use strict';
module.exports = {
  create: function(req, res) {
    return res.badRequest('CaveController.create not yet implemented!');
  },

  update: function(req, res) {
    return res.badRequest('CaveController.update not yet implemented!');
  },

  delete: function(req, res) {
    return res.badRequest('CaveController.delete not yet implemented!');
  },

  find: function(req, res) {
    TCave.findOneById(req.params.id).populate('author').populate('entries').populate('topographies').exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'CaveController.find';
      params.notFoundMessage = 'Cave of id ' + req.params.id + ' not found.';
      return ControllerService.treat(req, err, found, params, res);
    });
  },

  findAll: function(req, res) {
    let parameters = {};
    if (req.params.name !== undefined) {
      parameters.name = {
        'like': '%' + req.param('name') + '%'
      };
      sails.log.debug('parameters ' + parameters.name.like);
    }

    TCave.find(parameters).populate('author').populate('entries').sort('id ASC').limit(10).exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'CaveController.findAll';
      params.notFoundMessage = 'No caves found.';
      return ControllerService.treat(req, err, found, params, res);
    });
  }
};
