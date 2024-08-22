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
    return res.forbidden('You are not authorized to delete location.');

  const locationId = req.param('id');
  const location = await LocationService.getLocation(locationId);
  if (!location) {
    return res.notFound({ message: `Location of id ${locationId} not found.` });
  }

  if (!location.isDeleted) {
    await TLocation.destroyOne({ id: locationId }); // Soft delete
    location.isDeleted = true;
  }

  const deletePermanently = !!req.param('isPermanent');
  if (deletePermanently) {
    await HLocation.destroy({ t_id: locationId });
    await TLocation.destroyOne({ id: locationId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    req,
    location,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.LOCATION
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    location,
    { controllerMethod: 'LocationController.delete' },
    res,
    toSimpleLocation
  );
};
