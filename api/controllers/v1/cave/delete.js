const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const CaveService = require('../../../services/CaveService');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');
const { toCave } = require('../../../services/mapping/converters');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a cave.');
  }

  // Check if cave exists and if it's not already deleted
  // Read before any write: an invalid value must not leave a half-done delete.
  const { value: deletePermanently, error: isPermanentError } = readBoolParam(
    req,
    'isPermanent',
    false
  );
  if (isPermanentError) return res.badRequest(isPermanentError);

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
    cave.isDeleted = true;

    await Promise.all([
      CaveService.deleteInSearch(caveId),
      RecentChangeService.setDeleteRestoreAuthor(
        'delete',
        'cave',
        caveId,
        req.token.id
      ),
    ]);
  }

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

  // Fire-and-forget: don't block the response on subscriber notifications
  NotificationService.notifySubscribers(
    cave,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.CAVE
  ).catch((err) => {
    sails.log.error(
      `Failed to notify subscribers for cave ${caveId}: ${err.message}`
    );
  });

  return ControllerService.treatAndConvert(
    req,
    null,
    cave,
    { controllerMethod: 'CaveController.delete' },
    res,
    toCave
  );
};
