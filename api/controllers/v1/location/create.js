const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const LocationService = require('../../../services/LocationService');
const { toLocation } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
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

    const newLocation = await TLocation.create({
      author: req.token.id,
      body,
      dateInscription: new Date(),
      entrance: entranceId,
      language: languageId,
      title: req.param('title', null),
      // TODO compute relevance
    }).fetch();

    const locationPopulated = await LocationService.getLocation(newLocation.id);
    await NotificationService.notifySubscribers(
      req,
      locationPopulated,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.LOCATION
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      locationPopulated,
      { controllerMethod: 'LocationController.create' },
      res,
      toLocation
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
