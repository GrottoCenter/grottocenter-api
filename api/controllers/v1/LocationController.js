/**
 */

const locationController = require('../LocationController');
const MappingV1Service = require('../../services/MappingV1Service');

module.exports = {
  update: (req, res) =>
    locationController.update(
      req,
      res,
      MappingV1Service.convertToLocationModel
    ),
  create: (req, res) =>
    locationController.create(
      req,
      res,
      MappingV1Service.convertToLocationModel
    ),
};
