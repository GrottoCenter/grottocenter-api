const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const RelevanceService = require('../../../services/RelevanceService');
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

  const relevance = await RelevanceService.computeNextRelevance('location', {
    entrance: entranceId,
  });

  const newLocation = await TLocation.create({
    author: req.token.id,
    body,
    dateInscription: new Date(),
    entrance: entranceId,
    language: languageId,
    relevance,
    title: req.param('title', null),
  }).fetch();

  const locationPopulated = await LocationService.getLocation(newLocation.id);
  await NotificationService.notifySubscribers(
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
