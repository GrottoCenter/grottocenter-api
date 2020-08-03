/**
 */

const documentController = require('../DocumentController');

module.exports = {
  countBBS: (req, res, next) =>
    documentController.countBBS(
      req,
      res,
      next,
      MappingV1Service.convertToBbsModel,
    ),
};
