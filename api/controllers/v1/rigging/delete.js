const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const RiggingService = require('../../../services/RiggingService');
const { toSimpleRigging } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to delete rigging.');

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

  const deletePermanently = !!req.param('isPermanent');
  if (deletePermanently) {
    await HRigging.destroy({ t_id: riggingId });
    await TNotification.destroy({ rigging: riggingId });
    await TRigging.destroyOne({ id: riggingId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    req,
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
