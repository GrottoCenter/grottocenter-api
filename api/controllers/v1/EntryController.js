/**
 * EntryController
 *
 * @description :: Server-side logic for managing entries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
'use strict';
module.exports = {
  find: function(req, res) {
    return sails.controllers.entry.find(req, res, MappingV1Service.convertToEntryModel);
  },

  // TODO adapt
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

    // TODO : to adapt when authentication will be implemented
    parameters.isPublic = 'YES';

    // TODO before this : see how to materialize fact that
    // id of entry corresponds to id of linked single entry if exists
    //TEntry.find(parameters).populate('author').populate('caves').populate('singleEntry').sort('id ASC').limit(10).exec(function(err, found) {
    TEntry.find(parameters).populate('author').populate('caves').sort('id ASC').limit(10).exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'EntryController.findAll';
      params.notFoundMessage = 'No entries found.';
      return ControllerService.treat(err, found, params, res);
    });
  },

  // TODO adapt
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
  },

  getPublicEntriesNumber: function(req, res) {
    return sails.controllers.entry.getPublicEntriesNumber(req, res, MappingV1Service.convertToCountResult);
  },

  // TODO adapt
  getEntriesNumber: function(req, res) {
    TEntry.count().exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'EntryController.getEntriesNumber';
      params.notFoundMessage = 'Problem while getting number of entries.';

      let count = {};
      count.count = found;
      return ControllerService.treat(err, count, params, res);
    });
  }
};
