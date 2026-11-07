const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const CaveService = require('../../../services/CaveService');
const CaveLifecycleService = require('../../../services/CaveLifecycleService');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');
const { toCave } = require('../../../services/mapping/converters');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = async (req, res) => {
  const hasModeratorRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  const hasAdminRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasModeratorRight && !hasAdminRight) {
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

  // Permanent (irreversible) deletion is gated to administrators; moderators
  // may only soft-delete (matches device/delete.js, guideline/delete.js).
  if (deletePermanently && !hasAdminRight) {
    return res.forbidden(
      'You are not authorized to permanently delete a cave.'
    );
  }

  const caveId = req.param('id');
  const cave = await CaveService.getPopulatedCave(caveId);
  if (!cave) {
    return res.notFound({ message: `Cave of id ${caveId} not found.` });
  }

  // Built before the cave is touched: once it is gone, there is nothing
  // left to read it from. Nothing is written until the delete went through
  const pendingNotification =
    await NotificationService.prepareSubscribersNotification(
      cave,
      req.token.id,
      deletePermanently
        ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
        : NotificationService.NOTIFICATION_TYPES.DELETE,
      NotificationService.NOTIFICATION_ENTITIES.CAVE
    );

  if (!cave.isDeleted) {
    const redirectTo = parseInt(req.param('entityId'), 10);
    if (!Number.isNaN(redirectTo)) {
      cave.redirectTo = redirectTo;
      await TCave.updateOne(caveId)
        .set({ redirectTo })
        .catch(() => {});
    }

    // Soft delete, written as the UPDATE the production trigger makes of a
    // first destroy: a test database without that trigger keeps the row too,
    // which permanentlyDeleteCave() reads again under its lock.
    await TCave.updateOne(caveId).set({ isDeleted: true });
    cave.isDeleted = true;

    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'cave',
      caveId,
      req.token.id
    );
  }

  const mergeIntoId = parseInt(req.param('entityId'), 10);
  // A target that does not exist or is deleted is refused by
  // permanentlyDeleteCave(), once it holds the target's lock: a merge never
  // falls back to a plain delete that would detach the scientific data.
  const shouldMergeInto = !Number.isNaN(mergeIntoId);

  if (deletePermanently) {
    if (cave.entrances.length > 0 && !shouldMergeInto) {
      return res.badRequest({
        message: `This cave have associated entrance(s). You must provide another cave to attach them to.`,
      });
    }

    try {
      const deleted = await CaveService.permanentlyDeleteCave(
        cave,
        shouldMergeInto,
        mergeIntoId
      );
      // Removed by a concurrent permanent delete or merge since it was read
      if (!deleted) {
        return res.notFound({ message: `Cave of id ${caveId} not found.` });
      }
    } catch (err) {
      if (CaveLifecycleService.isMergeTargetUnavailable(err)) {
        return res.badRequest({ message: err.message });
      }
      throw err;
    }
  }

  // Fire-and-forget: don't block the response on subscriber notifications
  NotificationService.dispatchSubscribersNotification(
    pendingNotification
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
