const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const HistoryService = require('../../../services/HistoryService');
const { toSimpleHistory } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.HISTORY,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to update any history.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to update any history.');
    }

    const historyId = req.param('id');
    const rawHistory = await THistory.findOne(historyId);
    // TODO How to delete/restore entity ?
    if (!rawHistory || rawHistory.isDeleted) {
      return res.notFound({
        message: `History of id ${historyId} not found.`,
      });
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
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.HISTORY
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedHistory,
      { controllerMethod: 'HistoryController.update' },
      res,
      toSimpleHistory
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
