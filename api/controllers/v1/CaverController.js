/**
 * CaverController
 *
 * @description :: Server-side logic for managing cavers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const caverController = require('../CaverController');
const MappingV1Service = require('../../services/MappingV1Service');

module.exports = {
  // eslint-disable-next-line max-len
  find: (req, res, next, converter = MappingV1Service.convertToCaverModel) => caverController.find(req, res, next, converter),
  findAll: (req, res) => caverController.findAll(req, res),
  getModerators: (req, res) => caverController.getModerators(req, res),
  getAdmins: (req, res) => caverController.getAdmins(req, res),
  count: (req, res) => caverController.count(req, res),
  putOnGroup: async (req, res) => caverController.putOnGroup(req, res),
  removeFromGroup: async (req, res) => caverController.removeFromGroup(req, res),
  setGroups: async (req, res) => caverController.setGroups(req, res),
  create: async (
    req,
    res,
    next,
    converter = MappingV1Service.convertToCaverModel,
  ) => caverController.create(
    req,
    res,
    next,
    converter,
  ),
  addExploredEntrance: (req, res) => caverController.addExploredEntrance(req, res),
  removeExploredEntrance: (req, res) => caverController.removeExploredEntrance(req, res),
  usersCount: (req, res) => caverController.usersCount(req, res),
};
