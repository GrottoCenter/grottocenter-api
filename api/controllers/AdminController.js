/**
 * AdminController
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
    TEntry.findOneById(req.params.id).populate('author').populate('caves').populate('singleEntry').exec(function(err, found) {
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

    TEntry.find(parameters).populate('author').populate('caves').populate('singleEntry').sort('id ASC').limit(10).exec(function(err, found) {
      let params = {};
      params.controllerMethod = 'EntryController.findAll';
      params.notFoundMessage = 'No entries found.';
      return ControllerService.treat(err, found, params, res);
    });
  },

  findAllInterestEntries: function(req, res) {
    EntryService.findAllInterestEntries().then(function(results) {
      if (!results) {
        return res.notFound('No entry of interest found.');
      }
      return res.json(results);
    }, function(err) {
      sails.log.error(err);
      return res.serverError('EntryController.findAllRandomEntry error : ' + err);
    });
  }
};
