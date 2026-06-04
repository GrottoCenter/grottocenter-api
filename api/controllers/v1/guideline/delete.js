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

  if (guideline.isDeleted) {
    return res.notFound({
      message: `Guideline of id ${guidelineId} is already deleted.`,
    });
  }
  await TGuideline.destroyOne({ id: guidelineId }); // Trigger soft-deletes
  const deletedGuideline = await GuidelineService.getGuideline(guidelineId);

  // The DB trigger `change_guideline` automatically inserts a `t_last_change` row on soft-delete
  // (which is an UPDATE under the hood). We update that row's author here to specify the moderator.
  await RecentChangeService.setDeleteRestoreAuthor(
    'delete',
    'guideline',
    guidelineId,
    req.token.id
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    deletedGuideline,
    { controllerMethod: 'GuidelineController.delete' },
    res,
    toSimpleGuideline
  );
};
