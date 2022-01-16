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
  create: (req, res) => entranceController.create(req, res),
  delete: (req, res) => {
    entranceController.delete(req, res);
  },
  update: (req, res) =>
    entranceController.update(
      req,
      res,
      MappingV1Service.convertToEntranceModel,
    ),
  updateWithNewEntities: (req, res) =>
    entranceController.updateWithNewEntities(
      req,
      res,
      MappingV1Service.convertToEntranceModel,
    ),

  addDocument: (req, res) => {
    entranceController.addDocument(req, res);
  },
  unlinkDocument: (req, res) => {
    entranceController.unlinkDocument(req, res);
  },
  checkRows: (req, res) => entranceController.checkRows(req, res),
  importRows: (req, res) => entranceController.importRows(req, res),
};
