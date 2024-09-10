const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const CaveService = require('../../../services/CaveService');
const { toCave } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to restore a cave.');

  const caveId = req.param('id');
  const cave = await CaveService.getPopulatedCave(caveId);
  if (!cave || !cave.isDeleted) {
    return res.notFound({
      message: `Cave of id ${caveId} not found or not deleted.`,
    });
  }

  await TCave.updateOne({ id: caveId }).set({
    isDeleted: false,
    redirectTo: null,
  });
  cave.isDeleted = false;
  cave.redirectTo = null;

  await CaveService.createESCave(cave).catch(() => {});

  await NotificationService.notifySubscribers(
    req,
    cave,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.CAVE
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    cave,
    { controllerMethod: 'CaveController.restore' },
    res,
    toCave
  );
};
