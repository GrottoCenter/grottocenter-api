/**
 */

const grottoController = require('../GrottoController');

module.exports = {
  find: (req, res, next) =>
    grottoController.find(req, res, next, MappingV1Service.convertToGrottoModel),
};
