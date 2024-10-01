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
    return res.forbidden('You are not authorized to restore rigging.');

  const riggingId = req.param('id');
  const rigging = await RiggingService.getRigging(riggingId);
  if (!rigging || !rigging.isDeleted) {
    return res.notFound({
      message: `Rigging of id ${riggingId} not found or not deleted.`,
    });
  }

  await TRigging.updateOne({ id: riggingId }).set({ isDeleted: false });
  rigging.isDeleted = false;

  await RecentChangeService.setDeleteRestoreAuthor(
    'restore',
    'rigging',
    riggingId,
    req.token.id
  );

  await NotificationService.notifySubscribers(
    req,
    rigging,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.RIGGING
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    rigging,
    { controllerMethod: 'RiggingController.restore' },
    res,
    toSimpleRigging
  );
};
