/**
 */

const grottoController = require('../GrottoController');
const MappingV1Service = require('../../services/MappingV1Service');

module.exports = {
  count: (req, res, next) => grottoController.count(
    req,
    res,
    next,
    MappingV1Service.convertToCountResultModel,
  ),
  create: (req, res, next) => grottoController.create(
    req,
    res,
    next,
    MappingV1Service.convertToOrganizationModel,
  ),
  find: (req, res, next) => grottoController.find(
    req,
    res,
    next,
    MappingV1Service.convertToOrganizationModel,
  ),
  delete: (req, res) => {
    grottoController.delete(req, res);
  },
  update: (req, res) => grottoController.update(
    req,
    res,
    MappingV1Service.convertToOrganizationModel,
  ),
};
