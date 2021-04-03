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

  findRandom: (req, res, next) => {
    entranceController.findRandom(
      req,
      res,
      next,
      MappingV1Service.convertToEntranceModel,
    );
  },

  publicCount: (req, res) =>
    entranceController.publicCount(
      req,
      res,
      MappingV1Service.convertToCountResultModel,
    ),

  count: (req, res) => {
    entranceController.count(
      req,
      res,
      MappingV1Service.convertToCountResultModel,
    );
  },

  delete: (req, res) => {
    entranceController.delete(req, res);
  },
};
