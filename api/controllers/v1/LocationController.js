/**
 */

const locationController = require('../LocationController');

module.exports = {
  update: (req, res) =>
    locationController.update(
      req,
      res,
      MappingV1Service.convertToLocationModel,
    ),
};
