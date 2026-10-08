const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const RiggingService = require('../../../services/RiggingService');
const { toSimpleRigging } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to delete rigging.');

  // Read before any write: an invalid value must not leave a half-done delete.
  const { value: deletePermanently, error: isPermanentError } = readBoolParam(
    req,
    'isPermanent',
    false
  );
  if (isPermanentError) return res.badRequest(isPermanentError);

  const riggingId = req.param('id');
  const rigging = await RiggingService.getRigging(riggingId);
  if (!rigging) {
    return res.notFound({ message: `Rigging of id ${riggingId} not found.` });
  }

  if (!rigging.isDeleted) {
    await TRigging.destroyOne({ id: riggingId }); // Soft delete
    rigging.isDeleted = true;

    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'rigging',
      riggingId,
      req.token.id
    );
  }

  if (deletePermanently) {
    await HRigging.destroy({ t_id: riggingId });
    await TNotification.destroy({ rigging: riggingId });
    await TRigging.destroyOne({ id: riggingId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    rigging,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.RIGGING
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    rigging,
    { controllerMethod: 'RiggingController.delete' },
    res,
    toSimpleRigging
  );
};
