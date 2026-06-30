const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');

module.exports = async (req, res) => {
  const isModerator = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!isModerator && !isAdmin) {
    return res.forbidden('You are not authorized to delete guidelines.');
  }

  const guidelineId = req.param('id');
  const guideline = await GuidelineService.getGuideline(guidelineId);
  if (!guideline) {
    return res.notFound({
      message: `Guideline of id ${guidelineId} not found.`,
    });
  }

  const isPermanent = req.param('isPermanent') === 'true';

  if (isPermanent) {
    // Permanent (irreversible) deletion is gated to administrators; moderators
    // may only soft-delete (matches device/delete.js, sensor-configuration/delete.js).
    if (!isAdmin) {
      return res.forbidden(
        'You are not authorized to permanently delete guidelines.'
      );
    }

    // Two-phase delete via the histo_delete() trigger:
    // This pattern is shared across all soft-deletable entities in the project.
    if (!guideline.isDeleted) {
      await TGuideline.destroyOne({ id: guidelineId });
      // The `change_guideline` trigger inserts the `t_last_change` 'delete' row
      // on this soft-delete; attribute it to the admin.
      await RecentChangeService.setDeleteRestoreAuthor(
        'delete',
        'guideline',
        guidelineId,
        req.token.id
      );
    }

    // Remove FK-referencing children before the hard delete
    await sails.sendNativeQuery(
      'DELETE FROM j_guideline_country WHERE id_guideline = $1',
      [guidelineId]
    );
    await sails.sendNativeQuery(
      'DELETE FROM j_guideline_region WHERE id_guideline = $1',
      [guidelineId]
    );
    await sails.sendNativeQuery(
      'DELETE FROM j_guideline_massif WHERE id_guideline = $1',
      [guidelineId]
    );
    await HGuideline.destroy({ t_id: guidelineId });

    await TGuideline.destroyOne({ id: guidelineId }); // Phase 2: hard-delete
  } else {
    if (guideline.isDeleted) {
      return res.notFound({
        message: `Guideline of id ${guidelineId} is already deleted.`,
      });
    }
    await TGuideline.destroyOne({ id: guidelineId }); // Trigger soft-deletes

    // The DB trigger `change_guideline` automatically inserts a `t_last_change` row on soft-delete
    // (which is an UPDATE under the hood). We update that row's author here to specify the moderator.
    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'guideline',
      guidelineId,
      req.token.id
    );
  }

  // The row is gone after a hard delete, so reuse the already-fetched record
  // rather than re-querying (which would return null). Reflect the deleted state.
  guideline.isDeleted = true;

  return ControllerService.treatAndConvert(
    req,
    null,
    guideline,
    { controllerMethod: 'GuidelineController.delete' },
    res,
    toSimpleGuideline
  );
};
