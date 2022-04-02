/**
 */

const massifController = require('../MassifController');
const MappingV1Service = require('../../services/MappingV1Service');

module.exports = {
  find: (req, res, next) =>
    massifController.find(
      req,
      res,
      next,
      MappingV1Service.convertToMassifModel
    ),
  delete: (req, res) => massifController.delete(req, res),
  create: (req, res) => massifController.create(req, res),
};
