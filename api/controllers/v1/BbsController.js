/**
 */

const bbsController = require('../BbsController');

module.exports = {
  find: (req, res, next) =>
    bbsController.find(req, res, next, MappingV1Service.convertToBbsModel),

  count: (req, res, next) =>
    bbsController.count(req, res, next, MappingV1Service.convertToBbsModel),
};
