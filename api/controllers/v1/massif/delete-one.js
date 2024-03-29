const ElasticsearchService = require('../../../services/ElasticsearchService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a massif.');
  }

  // Check if massif exists and if it's not already deleted
  const massifId = req.param('id');
  const currentMassif = await TMassif.findOne(massifId);
  if (currentMassif) {
    if (currentMassif.isDeleted) {
      return res.status(410).send({
        message: `The massif with id ${massifId} has already been deleted.`,
      });
    }
  } else {
    return res.notFound({
      message: `Massif of id ${massifId} not found.`,
    });
  }
  // Delete massif
  await TMassif.destroyOne({ id: massifId }).intercept(() =>
    res.serverError(
      `An unexpected error occured when trying to delete massif with id ${massifId}.`
    )
  );

  await NotificationService.notifySubscribers(
    req,
    currentMassif,
    req.token.id,
    NOTIFICATION_TYPES.DELETE,
    NOTIFICATION_ENTITIES.MASSIF
  );
  await ElasticsearchService.deleteResource('massifs', massifId);

  return res.ok();
};
