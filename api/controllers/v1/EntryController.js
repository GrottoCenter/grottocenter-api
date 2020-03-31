/**
 * EntryController
 *
 * @description :: Server-side logic for managing entries
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const entryController = require('../EntryController');

module.exports = {
  find: (req, res) => entryController.find(req, res, MappingV1Service.convertToEntryModel),

  findAll: (req, res) => entryController.findAll(req, res, MappingV1Service.convertToEntryList),

  // TODO adapt
  findRandom: (req, res) => {
    EntryService.findRandom()
      .then((results) => {
        if (!results) {
          return res.notFound();
        }
        return res.json(results);
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(`EntryController.findRandom error : ${err}`);
      });
  },

  getPublicEntriesNumber: (req, res) =>
    entryController.getPublicEntriesNumber(req, res, MappingV1Service.convertToCountResult),

  // TODO adapt
  getEntriesNumber: (req, res) => {
    TEntry.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'EntryController.getEntriesNumber';
      params.notFoundMessage = 'Problem while getting number of entries.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },
};
