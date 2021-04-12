/**
 */

const grottoController = require('../GrottoController');

module.exports = {
  count: (req, res, next) =>
    grottoController.count(
      req,
      res,
      next,
      MappingV1Service.convertToCountResultModel,
    ),
  create: (req, res, next) =>
    grottoController.create(
      req,
      res,
      next,
      MappingV1Service.convertToOrganizationModel,
    ),
  find: (req, res, next) =>
    grottoController.find(
      req,
      res,
      next,
      MappingV1Service.convertToOrganizationModel,
    ),
  delete: (req, res) => {
    grottoController.delete(req, res);
  },
};
