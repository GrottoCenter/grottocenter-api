const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const RiggingService = require('../../../services/RiggingService');
const { toSimpleRigging } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const riggingId = req.param('id');
  const rawRigging = await TRigging.findOne(riggingId);
  if (!rawRigging || rawRigging.isDeleted) {
    return res.notFound({ message: `Rigging of id ${riggingId} not found.` });
  }

  const newTitle = req.param('title');
  const newLanguage = req.param('language');
  const obstacles = req.param('obstacles');
  let serializedObstacles;
  if (Array.isArray(obstacles)) {
    serializedObstacles =
      await RiggingService.serializeObstaclesForDB(obstacles);
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
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.RIGGING
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedRigging,
    { controllerMethod: 'RiggingController.update' },
    res,
    toSimpleRigging
  );
};
