/**
 * CaveController
 *
 * @description :: Server-side logic for managing caves
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const caveController = require('../CaveController');

module.exports = {
  find: (req, res, next) =>
    caveController.find(req, res, next, MappingV1Service.convertToCaveModel),

  findAll: (req, res) =>
    caveController.findAll(req, res, MappingV1Service.convertToCaveModel),

  delete: (req, res, next) => caveController.delete(req, res, next),
};
