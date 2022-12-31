const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const HistoryService = require('../../../services/HistoryService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const { toSimpleHistory } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.HISTORY,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occurred when checking your right to create an history.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to create an history.');
    }

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
