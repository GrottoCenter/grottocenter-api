const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');

const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const RiggingService = require('../../../services/RiggingService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const { toSimpleRigging } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.RIGGING,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occurred when checking your right to create a rigging.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to create a rigging.');
    }

    const mandatoryParams = ParametersValidatorService.checkAllExist(req, res, [
      'title',
      'language',
    ]);
    if (!mandatoryParams) return null;
    const [title, language] = mandatoryParams;

    const linkedEntity = await ParametersValidatorService.checkOneOfEntityExist(
      req,
      res,
      ['cave', 'entrance', 'point']
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
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.RIGGING
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedRigging,
      { controllerMethod: 'RiggingController.create' },
      res,
      toSimpleRigging
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
