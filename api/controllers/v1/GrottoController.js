/**
 */

const grottoController = require('../GrottoController');

module.exports = {
  find: (req, res, next) =>
    grottoController.find(
      req,
      res,
      next,
      MappingV1Service.convertToOrganizationModel,
    ),
  create: (req, res, next) =>
    grottoController.create(
      req,
      res,
      next,
      MappingV1Service.convertToOrganizationModel,
    ),
};
