const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/mapping/MappingService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
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

  // Check mandatory params
  // TODO refactor with issue #717
  const mandatoryParams = ['body', 'entrance', 'language'];
  const paramsNameAndValue = mandatoryParams.map((p) => ({
    name: p,
    value: req.param(p),
  }));
  const missingParam = paramsNameAndValue.find((p) => !p.value);
  if (missingParam) {
    return res.badRequest(
      `You must provide a${missingParam.name === 'entrance' ? 'n' : ''} ${
        missingParam.name
      } to create an history.`
    );
  }

  // Entrance not found check
  const entranceId = paramsNameAndValue.find(
    (p) => p.name === 'entrance'
  ).value;
  const doesEntranceExists = await sails.helpers.checkIfExists.with({
    attributeName: 'id',
    attributeValue: entranceId,
    sailsModel: TEntrance,
  });
  if (!doesEntranceExists) {
    return res.notFound({
      message: `The entrance with id ${entranceId} was not found.`,
    });
  }

  // Unwrap values
  const body = paramsNameAndValue.find((p) => p.name === 'body').value;
  const language = paramsNameAndValue.find((p) => p.name === 'language').value;

  try {
    const newHistory = await THistory.create({
      author: req.token.id,
      body,
      dateInscription: new Date(),
      entrance: entranceId,
      language,
    }).fetch();
    const newHistoryPopulated = await THistory.findOne(newHistory.id)
      .populate('author')
      .populate('entrance')
      .populate('language');

    await NotificationService.notifySubscribers(
      req,
      newHistoryPopulated,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.HISTORY
    );

    const params = {};
    params.controllerMethod = 'HistoryController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newHistoryPopulated,
      params,
      res,
      MappingService.convertToHistoryModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
