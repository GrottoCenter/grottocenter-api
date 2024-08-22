const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const LocationService = require('../../../services/LocationService');
const { toSimpleLocation } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to restore location.');

  const locationId = req.param('id');
  const location = await LocationService.getLocation(locationId);
  if (!location || !location.isDeleted) {
    return res.notFound({
      message: `Location of id ${locationId} not found or not deleted.`,
    });
  }

  await TLocation.updateOne({ id: locationId }).set({ isDeleted: false });
  location.isDeleted = false;

  await NotificationService.notifySubscribers(
    req,
    location,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.LOCATION
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    location,
    { controllerMethod: 'LocationController.restore' },
    res,
    toSimpleLocation
  );
};
