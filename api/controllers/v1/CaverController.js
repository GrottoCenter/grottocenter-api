/**
 * CaverController
 *
 * @description :: Server-side logic for managing cavers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const caverController = require('../CaverController');

module.exports = {
  find: (req, res) => caverController.find(req, res),
  findAll: (req, res) => caverController.findAll(req, res),
  getCaversNumber: (req, res) => caverController.getCaversNumber(req, res),

  putOnGroup: async (req, res) => caverController.putOnGroup(req, res),
  removeFromGroup: async (req, res) =>
    caverController.removeFromGroup(req, res),
  setGroups: async (req, res) => caverController.setGroups(req, res),

  create: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToCaverModel,
  ) =>
    caverController.create(
      req,
      res,
      next,
      (converter = MappingV1Service.convertToCaverModel),
    ),
};
