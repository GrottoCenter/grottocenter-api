/**
 * EntryController
 *
 * @description :: Server-side logic for managing entries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
'use strict';
module.exports = {

  find: function(req, res, converter) {
    TEntry.findOne({
      id: req.params.id,
      // TODO : to adapt when authentication will be implemented
      isPublic:'YES'
    // TODO before this : see how to materialize fact that
    // id of entry corresponds to id of linked single entry if exists
    //}).populate('author').populate('cave').populate('singleEntry').exec(function(err, found) {
    }).populate('author').populate('cave').exec(function(err, found) {
      let params = {};
      params.searchedItem = 'Entry of id ' + req.params.id;
      return ControllerService.treatAndConvert(req, err, found, params, res, converter);
    });
  },

  findAll: function(req, res, converter) {
    const apiControl = req.options.api;
    let parameters = {};
    let limit = apiControl.limit;
    let skip = 0;

    if (req.param('name')) {
      parameters.name = {
        'like': '%' + req.param('name') + '%'
      };
    }
    if (req.param('region')) {
      parameters.region = {
        'like': '%' + req.param('region') + '%'
      };
    }

    const maxRange = apiControl.limit;
    const range = req.param('range');

    if (range !== undefined) {
      const splitRange = range.split('-');
      limit = splitRange[1] - splitRange[0];
      skip = splitRange[0];
    }

    // TODO : to adapt when authentication will be implemented
    parameters.isPublic = 'YES';

    // TODO before this : see how to materialize fact that
    // id of entry corresponds to id of linked single entry if exists
    //TEntry.find(parameters).populate('author').populate('cave').populate('singleEntry').sort('id ASC').limit(10).exec(function(err, found) {
    TEntry.count(parameters).exec(function (error, total) {
      TEntry.find(parameters).populate('author').populate('cave').sort('id ASC').limit(limit).skip(skip).exec(function(err, found) {
        let params = {
          controllerMethod: 'EntryController.findAll',
          notFoundMessage: 'No entries found.',
          searchedItem: apiControl.entity,
          total: total,
          url: req.originalUrl,
          maxRange: maxRange,
          limit: limit,
          skip: skip,
        };

        return ControllerService.treatAndConvert(req, err, found, params, res, converter);
      });
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
  },

  getPublicEntriesNumber: function(req, res, converter) {
    EntryService.getPublicEntriesNumber()
      .then(function(count) {
        if (!count) {
          return res.status(404).json({ error: 'Problem while getting number of public entries' });
        }
        return res.json(converter(count));
      })
      .catch(function(err) {
        let errorMessage = 'An internal error occurred when getting number of public entries';
        sails.log.error(errorMessage + ': ' + err);
        return res.status(500).json({ error: errorMessage });
      });
  },

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
