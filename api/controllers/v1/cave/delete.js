const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const CaveService = require('../../../services/CaveService');
const RightService = require('../../../services/RightService');
const { toCave } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a cave.');
  }

  // Check if cave exists and if it's not already deleted
  const caveId = req.param('id');
  const cave = await CaveService.getPopulatedCave(caveId);
  if (!cave) {
    return res.notFound({ message: `Cave of id ${caveId} not found.` });
  }

  if (!cave.isDeleted) {
    const redirectTo = parseInt(req.param('entityId'), 10);
    if (!Number.isNaN(redirectTo)) {
      cave.redirectTo = redirectTo;
      await TCave.updateOne(caveId)
        .set({ redirectTo })
        .catch(() => {});
    }

    await TCave.destroyOne({ id: caveId }); // Soft delete
    await ElasticsearchService.deleteResource('caves', caveId).catch(() => {});
    cave.isDeleted = true;
  }

  const deletePermanently = !!req.param('isPermanent');
  const mergeIntoId = parseInt(req.param('entityId'), 10);
  let shouldMergeInto = !Number.isNaN(mergeIntoId);
  if (shouldMergeInto) {
    const mergeIntoEntity = await TCave.findOne(mergeIntoId);
    shouldMergeInto = !!mergeIntoEntity;
  }

  if (deletePermanently) {
    if (cave.entrances.length > 0 && !shouldMergeInto) {
      return res.badRequest({
        message: `This cave have associated entrance(s). You must provide another cave to attach them to.`,
      });
    }

    await CaveService.permanentlyDeleteCave(cave, shouldMergeInto, mergeIntoId);
  }

  await NotificationService.notifySubscribers(
    req,
    cave,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.CAVE
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    cave,
    { controllerMethod: 'CaveController.delete' },
    res,
    toCave
  );
};
