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
  // Both Moderator and Administrator may see soft-deleted guidelines: those are
  // exactly the two roles that can delete and restore one (guideline/delete.js,
  // guideline/restore.js). Roles are not hierarchical here, hence two
  // independent checks rather than the single MODERATOR test the core-content
  // find controllers use — that test would lock a non-Moderator Administrator
  // out of content they are allowed to delete.
  const isModerator = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );
  const isAdmin = RightService.hasGroup(
    req.token?.groups,
    RightService.G.ADMINISTRATOR
  );
  const canViewDeleted = isModerator || isAdmin;

  const guideline = await GuidelineService.getGuidelineDetail(guidelineId);

  // A missing guideline and a soft-deleted one this caller may not see must be
  // indistinguishable, so both exit through the same message. Privileged callers
  // fall through to the full hydrated GuidelineDetail with `isDeleted: true` —
  // deliberately not the reduced `toDeletedEntity` shape used by
  // entrance/cave/massif, because the front end needs the whole record to render
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
