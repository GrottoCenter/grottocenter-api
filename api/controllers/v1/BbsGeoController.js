/**
 */

const bbsGeoController = require('../BbsGeoController');

module.exports = {
  find: (req, res, next) =>
    bbsGeoController.find(
      req,
      res,
      next,
      MappingV1Service.convertToBbsGeoModel,
    ),
};
