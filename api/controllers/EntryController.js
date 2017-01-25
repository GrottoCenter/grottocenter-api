/**
 * EntryController
 *
 * @description :: Server-side logic for managing entries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
'use strict';
module.exports = {
  index: function(req, res) {
    TEntry.find().limit(10).exec(function(err, found) {
      return res.view({
        entrylist: found
      });
    });
  },

  find: function(req, res) {
    TEntry.findOneById(req.params.id).populate('author').populate('caves').exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'EntryController.find';
      params.notFoundMessage = 'Entry of id ' + req.params.id + ' not found.';
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

    TEntry.find(parameters).populate('author').populate('caves').sort('id ASC').limit(10).exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'EntryController.readAll';
      params.notFoundMessage = 'No entries found.';
      return ControllerService.treat(err, found, params, res);
    });
  },

  findRandom: function(req, res) {
    EntryService.findRandom().then(function(results) {
      if (!results) {
        return res.notFound('No entry found.');
      }
      return res.json(results);
    }, function(err) {
      sails.log.error(err);
      return res.serverError('EntryController.findRandom error : ' + err);
    });
  }
};
