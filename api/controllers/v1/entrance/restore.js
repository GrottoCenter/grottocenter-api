const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const EntranceService = require('../../../services/EntranceService');
const { toEntrance } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to restore an entrance.');

  const entranceId = req.param('id');
  const entrance = await EntranceService.getPopulatedEntrance(entranceId);
  if (!entrance || !entrance.isDeleted) {
    return res.notFound({
      message: `Entrance of id ${entranceId} not found or not deleted.`,
    });
  }

  await TEntrance.updateOne({ id: entranceId }).set({
    isDeleted: false,
    redirectTo: null,
  });
  entrance.isDeleted = false;
  entrance.redirectTo = null;

  await RecentChangeService.setDeleteRestoreAuthor(
    'restore',
    'entrance',
    entranceId,
    req.token.id
  );

  await EntranceService.createESEntrance(entrance).catch(() => {});

  await NotificationService.notifySubscribers(
    req,
    entrance,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.ENTRANCE
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    entrance,
    { controllerMethod: 'EntranceController.restore' },
    res,
    toEntrance
  );
};
