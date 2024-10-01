const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const MassifService = require('../../../services/MassifService');
const { toMassif } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to restore a massif.');

  const massifId = req.param('id');
  const massif = await MassifService.getPopulatedMassif(massifId);
  if (!massif || !massif.isDeleted) {
    return res.notFound({
      message: `Massif of id ${massifId} not found or not deleted.`,
    });
  }

  await TMassif.updateOne({ id: massifId }).set({
    isDeleted: false,
    redirectTo: null,
  });
  massif.isDeleted = false;
  massif.redirectTo = null;

  await RecentChangeService.setDeleteRestoreAuthor(
    'restore',
    'massif',
    massifId,
    req.token.id
  );

  await MassifService.createESMassif(massif).catch(() => {});

  await NotificationService.notifySubscribers(
    req,
    massif,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.MASSIF
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    massif,
    { controllerMethod: 'MassifController.restore' },
    res,
    toMassif
  );
};
