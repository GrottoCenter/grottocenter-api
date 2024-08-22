const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const LocationService = require('../../../services/LocationService');
const { toSimpleLocation } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
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
    NotificationService.NOTIFICATION_TYPES.CREATE,
    NotificationService.NOTIFICATION_ENTITIES.LOCATION
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    locationPopulated,
    { controllerMethod: 'LocationController.create' },
    res,
    toSimpleLocation
  );
};
