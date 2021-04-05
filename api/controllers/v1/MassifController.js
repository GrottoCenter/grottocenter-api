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
  delete: (req, res) => massifController.delete(req, res),
};
