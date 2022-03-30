/**
 * CaveController
 *
 * @description :: Server-side logic for managing caves
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const caveController = require('../CaveController');

module.exports = {
  find: (req, res, next) => caveController.find(req, res, next, MappingV1Service.convertToCaveModel),

  findAll: (req, res) => caveController.findAll(req, res, MappingV1Service.convertToCaveList),
  create: (req, res) => caveController.create(req, res, MappingV1Service.convertToCaveModel),
  delete: (req, res, next) => caveController.delete(req, res, next),
  addDocument: async (req, res) => caveController.addDocument(req, res),
  update: (req, res) => caveController.update(req, res, MappingV1Service.convertToCaveModel),
  setMassif: (req, res) => caveController.setMassif(req, res),
};
