const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const RiggingService = require('../../../services/RiggingService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.RIGGING,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update any rigging.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update any rigging.');
  }

  // Check if rigging exists
  const riggingId = req.param('id');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: riggingId,
      sailsModel: TRigging,
    }))
  )
    return res.notFound({
      message: `Rigging of id ${riggingId} not found.`,
    });

  const parsedObstacles = await RiggingService.parseAPIObstaclesArrForDB(
    req.param('obstacles', [])
  );
  const newTitle = req.param('title');
  const newObstacles = parsedObstacles.obstacles;
  const newRopes = parsedObstacles.ropes;
  const newAnchors = parsedObstacles.anchors;
  const newObservations = parsedObstacles.observations;
  const newLanguage = req.param('language');
  const cleanedData = {
    ...(newTitle && { title: newTitle }),
    reviewer: req.token.id,
    obstacles: newObstacles,
    ropes: newRopes,
    anchors: newAnchors,
    observations: newObservations,
    ...(newLanguage && { language: newLanguage }),
  };

  try {
    await TRigging.updateOne({
      id: riggingId,
    }).set(cleanedData);
    const populatedRigging = await TRigging.findOne(riggingId)
      .populate('author')
      .populate('entrance')
      .populate('cave')
      .populate('language')
      .populate('reviewer');

    await NotificationService.notifySubscribers(
      req,
      populatedRigging,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.RIGGING
    );

    const params = {};
    params.controllerMethod = 'RiggingController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      populatedRigging,
      params,
      res,
      MappingService.convertToRiggingModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
