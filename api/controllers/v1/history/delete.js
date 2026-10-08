const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const HistoryService = require('../../../services/HistoryService');
const { toSimpleHistory } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to delete history.');

  // Read before any write: an invalid value must not leave a half-done delete.
  const { value: deletePermanently, error: isPermanentError } = readBoolParam(
    req,
    'isPermanent',
    false
  );
  if (isPermanentError) return res.badRequest(isPermanentError);

  const historyId = req.param('id');
  const history = await HistoryService.getHistory(historyId);
  if (!history) {
    return res.notFound({ message: `History of id ${historyId} not found.` });
  }

  if (!history.isDeleted) {
    await THistory.destroyOne({ id: historyId }); // Soft delete
    history.isDeleted = true;

    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'history',
      historyId,
      req.token.id
    );
  }

  if (deletePermanently) {
    await HHistory.destroy({ t_id: historyId });
    await TNotification.destroy({ history: historyId });
    await THistory.destroyOne({ id: historyId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    history,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.HISTORY
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    history,
    { controllerMethod: 'HistoryController.delete' },
    res,
    toSimpleHistory
  );
};
