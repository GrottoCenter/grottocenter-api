const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const HistoryService = require('../../../services/HistoryService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const { toSimpleHistory } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const mandatoryParams = ParametersValidatorService.checkAllExist(req, res, [
      'entrance',
      'body',
      'language',
    ]);
    if (!mandatoryParams) return null;
    const [entranceId, body, languageId] = mandatoryParams;

    const linkedEntity = await ParametersValidatorService.checkOneOfEntityExist(
      req,
      res,
      ['entrance']
    );
    if (!linkedEntity) return null;

    const newHistory = await THistory.create({
      author: req.token.id,
      body,
      dateInscription: new Date(),
      entrance: entranceId,
      language: languageId,
      // TODO compute relevance
    }).fetch();

    const populatedHistory = await HistoryService.getHistory(newHistory.id);
    await NotificationService.notifySubscribers(
      req,
      populatedHistory,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.HISTORY
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedHistory,
      { controllerMethod: 'HistoryController.create' },
      res,
      toSimpleHistory
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
