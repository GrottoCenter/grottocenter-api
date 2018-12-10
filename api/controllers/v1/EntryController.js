/**
 * EntryController
 *
 * @description :: Server-side logic for managing entries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
'use strict';

const entryController = require('../EntryController');

module.exports = {
  find: function(req, res) {
    return entryController.find(req, res, MappingV1Service.convertToEntryModel);
  },

  findAll: function(req, res) {
    return entryController.findAll(req, res, MappingV1Service.convertToEntryList);
  },

  // TODO adapt
  findRandom: function(req, res) {
    EntryService.findRandom()
      .then(function(results) {
        if (!results) {
          return res.notFound('No entry found.');
        }
        return res.json(results);
      })
      .catch(function(err) {
        sails.log.error(err);
        return res.serverError('EntryController.findRandom error : ' + err);
      });
  },

  getPublicEntriesNumber: function(req, res) {
    return entryController.getPublicEntriesNumber(req, res, MappingV1Service.convertToCountResult);
  },

  // TODO adapt
  getEntriesNumber: function(req, res) {
    TEntry.count().exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'EntryController.getEntriesNumber';
      params.notFoundMessage = 'Problem while getting number of entries.';

      let count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  }
};
