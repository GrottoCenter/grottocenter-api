const ControllerService = require('../../../services/ControllerService');
const LocationService = require('../../../services/LocationService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleLocation } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasCompleteViewRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.ADMINISTRATOR
  );

  const locationsH = await LocationService.getHLocation(
    req.params.id,
    hasCompleteViewRight
  );
  if (Object.keys(locationsH).length === 0) {
    return res.notFound(`Location ${req.params.id} has no snapshot.`);
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    locationsH,
    { controllerMethod: 'LocationController.getAllSnapshots' },
    res,
    (data) => toListFromController('locations', data, toSimpleLocation)
  );
};
