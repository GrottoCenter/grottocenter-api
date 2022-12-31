const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const RiggingService = require('../../../services/RiggingService');
const { toSimpleRigging } = require('../../../services/mapping/converters');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

module.exports = async (req, res) => {
  try {
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

    const riggingId = req.param('id');
    const rawRigging = await TRigging.findOne(riggingId);
    // TODO How to delete/restore entity ?
    if (!rawRigging || rawRigging.isDeleted) {
      return res.notFound({
        message: `Rigging of id ${riggingId} not found.`,
      });
    }

    const newTitle = req.param('title');
    const newLanguage = req.param('language');
    const obstacles = req.param('obstacles');
    let serializedObstacles;
    if (Array.isArray(obstacles)) {
      serializedObstacles = await RiggingService.serializeObstaclesForDB(
        obstacles
      );
    }

    const updatedFields = {
      reviewer: req.token.id,
      // dateReviewed will be updated automaticly by the SQL historisation trigger
    };

    if (newTitle) updatedFields.title = newTitle;
    if (newLanguage) updatedFields.language = newLanguage;
    if (serializedObstacles) {
      updatedFields.obstacles = serializedObstacles.obstacles;
      updatedFields.ropes = serializedObstacles.ropes;
      updatedFields.anchors = serializedObstacles.anchors;
      updatedFields.observations = serializedObstacles.observations;
    }
    // TODO re-compute relevance ?

    await TRigging.updateOne({ id: riggingId }).set(updatedFields);

    const populatedRigging = await RiggingService.getRigging(riggingId);
    await NotificationService.notifySubscribers(
      req,
      populatedRigging,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.RIGGING
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedRigging,
      { controllerMethod: 'RiggingController.update' },
      res,
      toSimpleRigging
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
