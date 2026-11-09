const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const RightService = require('../../../services/RightService');
const { toGuideline } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const guidelineId = req.param('id');

  // No tokenAuth policy — the endpoint stays publicly readable for active
  // guidelines. The `parseAuthToken` middleware (config/http.js) still populates
  // req.token whenever a valid Bearer token is sent, on any route, so guard the
  // access to avoid crashes on anonymous requests. Same pattern as
  // device/find.js, entrance/find.js, cave/find.js, massif/find.js.
  //
  // Administrators and moderators may see soft-deleted guidelines: those are
  // exactly the two roles that can delete and restore one. Roles are not
  // hierarchical, so either one is enough (RightService.canViewDeleted).
  const canViewDeleted = RightService.canViewDeleted(req.token?.groups);

  const guideline = await GuidelineService.getGuidelineDetail(guidelineId);

  // A missing guideline and a soft-deleted one this caller may not see must be
  // indistinguishable, so both exit through the same message. Privileged callers
  // fall through to the full hydrated GuidelineDetail with `isDeleted: true` —
  // deliberately not the reduced `toDeletedEntity` shape that
  // entrance/cave/massif give unprivileged callers, because the front end needs the whole record to render
  // the deleted state and the restore action after a page reload.
  if (!guideline || (guideline.isDeleted && !canViewDeleted)) {
    return res.notFound({
      message: `Guideline of id ${guidelineId} not found.`,
    });
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    guideline,
    { controllerMethod: 'GuidelineController.find' },
    res,
    toGuideline
  );
};
