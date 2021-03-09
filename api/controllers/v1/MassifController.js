/**
 */

const massifController = require('../MassifController');

module.exports = {
  find: (req, res, next) =>
    massifController.find(
      req,
      res,
      next,
      MappingV1Service.convertToMassifModel,
    ),
};
