const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toLocation } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.LOCATION,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create a location.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to create a location.');
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
      } to create a location.`
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
    const newLocation = await TLocation.create({
      author: req.token.id,
      body,
      dateInscription: new Date(),
      entrance: entranceId,
      language,
      title: req.param('title', null),
    }).fetch();
    const newLocationPopulated = await TLocation.findOne(newLocation.id)
      .populate('author')
      .populate('entrance')
      .populate('language');

    await NotificationService.notifySubscribers(
      req,
      newLocationPopulated,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.LOCATION
    );

    const params = {};
    params.controllerMethod = 'LocationController.create';
    return ControllerService.treatAndConvert(
      req,
      null,
      newLocationPopulated,
      params,
      res,
      toLocation
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
