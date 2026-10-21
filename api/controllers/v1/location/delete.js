const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const LocationService = require('../../../services/LocationService');
const { toSimpleLocation } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = async (req, res) => {
  const hasModeratorRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  const hasAdminRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasModeratorRight && !hasAdminRight)
    return res.forbidden('You are not authorized to delete location.');

  // Read before any write: an invalid value must not leave a half-done delete.
  const { value: deletePermanently, error: isPermanentError } = readBoolParam(
    req,
    'isPermanent',
    false
  );
  if (isPermanentError) return res.badRequest(isPermanentError);

  // Permanent (irreversible) deletion is gated to administrators; moderators
  // may only soft-delete (matches device/delete.js, guideline/delete.js).
  if (deletePermanently && !hasAdminRight) {
    return res.forbidden(
      'You are not authorized to permanently delete location.'
    );
  }

  const locationId = req.param('id');
  const location = await LocationService.getLocation(locationId);
  if (!location) {
    return res.notFound({ message: `Location of id ${locationId} not found.` });
  }

  // Built before the location is touched: once it is gone, there is nothing
  // left to read it from. Nothing is written until the delete went through
  const pendingNotification =
    await NotificationService.prepareSubscribersNotification(
      location,
      req.token.id,
      deletePermanently
        ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
        : NotificationService.NOTIFICATION_TYPES.DELETE,
      NotificationService.NOTIFICATION_ENTITIES.LOCATION
    );

  if (!location.isDeleted) {
    await TLocation.destroyOne({ id: locationId }); // Soft delete
    location.isDeleted = true;

    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'location',
      locationId,
      req.token.id
    );
  }

  if (deletePermanently) {
    await HLocation.destroy({ t_id: locationId });
    await TNotification.destroy({ location: locationId });
    await TLocation.destroyOne({ id: locationId }); // Hard delete
  }

  await NotificationService.dispatchSubscribersNotification(
    pendingNotification
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
