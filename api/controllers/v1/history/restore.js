const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const HistoryService = require('../../../services/HistoryService');
const { toSimpleHistory } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to restore history.');

  const historyId = req.param('id');
  const history = await HistoryService.getHistory(historyId);
  if (!history || !history.isDeleted) {
    return res.notFound({
      message: `History of id ${historyId} not found or not deleted.`,
    });
  }

  await THistory.updateOne({ id: historyId }).set({ isDeleted: false });
  history.isDeleted = false;

  await NotificationService.notifySubscribers(
    req,
    history,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.HISTORY
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    history,
    { controllerMethod: 'HistoryController.restore' },
    res,
    toSimpleHistory
  );
};
