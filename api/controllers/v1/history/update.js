const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const HistoryService = require('../../../services/HistoryService');
const { toSimpleHistory } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const historyId = req.param('id');
  const rawHistory = await THistory.findOne(historyId);
  if (!rawHistory || rawHistory.isDeleted) {
    return res.notFound({ message: `History of id ${historyId} not found.` });
  }

  const newBody = req.param('body');
  const newLanguage = req.param('language');
  const updatedFields = {
    reviewer: req.token.id,
    // dateReviewed will be updated automaticly by the SQL historisation trigger
  };
  if (newBody) updatedFields.body = newBody;
  if (newLanguage) updatedFields.language = newLanguage;
  // TODO re-compute relevance ?

  await THistory.updateOne({ id: historyId }).set(updatedFields);

  const populatedHistory = await HistoryService.getHistory(historyId);
  await NotificationService.notifySubscribers(
    req,
    populatedHistory,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.HISTORY
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedHistory,
    { controllerMethod: 'HistoryController.update' },
    res,
    toSimpleHistory
  );
};
