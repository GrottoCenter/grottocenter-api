/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const entranceController = require('../EntranceController');

module.exports = {
  find: (req, res) =>
    entranceController.find(req, res, MappingV1Service.convertToEntranceModel),

  // TODO adapt
  findRandom: (req, res, next) => {
    entranceController.findRandom(
      req,
      res,
      next,
      MappingV1Service.convertToEntranceModel,
    );
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
