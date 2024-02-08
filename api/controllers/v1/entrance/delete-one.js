const ElasticsearchService = require('../../../services/ElasticsearchService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete an entrance.');
  }

  // Check if entrance exists and if it's not already deleted
  const entranceId = req.param('id');
  const currentEntrance = await TEntrance.findOne(entranceId);
  if (currentEntrance) {
    if (currentEntrance.isDeleted) {
      return res.status(410).send({
        message: `The entrance with id ${entranceId} has already been deleted.`,
      });
    }
  } else {
    return res.notFound({
      message: `Entrance of id ${entranceId} not found.`,
    });
  }

  // Delete Entrance
  await TEntrance.destroyOne({
    id: entranceId,
  }).intercept(() =>
    res.serverError(
      `An unexpected error occured when trying to delete entrance with id ${entranceId}.`
    )
  );

  await NotificationService.notifySubscribers(
    req,
    currentEntrance,
    req.token.id,
    NOTIFICATION_TYPES.DELETE,
    NOTIFICATION_ENTITIES.ENTRANCE
  );

  await ElasticsearchService.deleteResource('entrances', entranceId);

  return res.ok();
};
