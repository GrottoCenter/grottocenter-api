/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const entranceController = require('../EntranceController');

module.exports = {
  find: (req, res) =>
    entranceController.find(req, res, MappingV1Service.convertToEntryModel),

  findAll: (req, res) =>
    entranceController.findAll(req, res, MappingV1Service.convertToEntryList),

  // TODO adapt
  findRandom: (req, res) => {
    EntranceService.findRandom()
      .then((results) => {
        if (!results) {
          return res.notFound();
        }
        return res.json(results);
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(`EntranceController.findRandom error : ${err}`);
      });
  },

  getPublicEntrancesNumber: (req, res) =>
    entranceController.getPublicEntrancesNumber(
      req,
      res,
      MappingV1Service.convertToCountResult,
    ),

  // TODO adapt
  getEntrancesNumber: (req, res) => {
    TEntrance.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'EntranceController.getEntrancesNumber';
      params.notFoundMessage = 'Problem while getting number of entries.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },
};
