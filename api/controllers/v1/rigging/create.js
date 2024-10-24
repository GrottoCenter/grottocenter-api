const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const RiggingService = require('../../../services/RiggingService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const { toSimpleRigging } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const mandatoryParams = ParametersValidatorService.checkAllExist(req, res, [
    'title',
    'language',
  ]);
  if (!mandatoryParams) return null;
  const [title, language] = mandatoryParams;

  const linkedEntity = await ParametersValidatorService.checkOneOfEntityExist(
    req,
    res,
    ['entrance']
  );
  if (!linkedEntity) return null;

  const parsedObstacles = await RiggingService.serializeObstaclesForDB(
    req.param('obstacles', [])
  );
  const newRigging = await TRigging.create({
    author: req.token.id,
    title,
    obstacles: parsedObstacles.obstacles,
    ropes: parsedObstacles.ropes,
    anchors: parsedObstacles.anchors,
    observations: parsedObstacles.observations,
    dateInscription: new Date(),
    language,
    [linkedEntity.type]: linkedEntity.id,
    // TODO compute relevance
  }).fetch();

  const populatedRigging = await RiggingService.getRigging(newRigging.id);
  await NotificationService.notifySubscribers(
    req,
    populatedRigging,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.CREATE,
    NotificationService.NOTIFICATION_ENTITIES.RIGGING
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedRigging,
    { controllerMethod: 'RiggingController.create' },
    res,
    toSimpleRigging
  );
};
