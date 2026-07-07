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

  // The web client sends `?isPermanent=1`; accept the common truthy encodings
  // ('1'/'true', or a real boolean from a JSON body) while treating explicit
  // falsy values ('0'/'false') and an absent param as a soft delete. A bare
  // `!!req.param(...)` would wrongly treat `isPermanent=0`/`false` as permanent.
  const isPermanent = [true, 'true', '1'].includes(req.param('isPermanent'));

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

    // Remove FK-referencing children before the hard delete. Unlike
    // device/delete.js and sensor-configuration/delete.js, we don't pre-check
    // for children and return res.conflict(): the only rows pointing at
    // t_guideline are these junction tables (countries/regions/massifs), which
    // we own and delete outright. If a future FK to t_guideline is added that
    // isn't cleared here, the phase-2 hard delete will surface a raw DB error
    // instead of a friendly 409 — add the corresponding cleanup (or a guard) then.
    await JGuidelineCountry.destroy({ guideline: guidelineId });
    await JGuidelineRegion.destroy({ guideline: guidelineId });
    await JGuidelineMassif.destroy({ guideline: guidelineId });
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
  // The populated countries/regions/massifs arrays on this object still reflect
  // the pre-delete state; this matches the previous behaviour (which re-fetched
  // right after the soft-delete) and relies on the `change_guideline` trigger
  // not cascading to the junction rows on soft-delete — an implicit contract.
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
