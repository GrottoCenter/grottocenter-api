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
    return res.forbidden('You are not authorized to restore guidelines.');
  }

  const guidelineId = req.param('id');
  const guideline = await GuidelineService.getGuideline(guidelineId);
  if (!guideline) {
    return res.notFound({
      message: `Guideline of id ${guidelineId} not found.`,
    });
  }
  if (!guideline.isDeleted) {
    return res.badRequest({
      message: `Guideline of id ${guidelineId} is not deleted.`,
    });
  }

  await TGuideline.updateOne({ id: guidelineId }).set({
    isDeleted: false,
    reviewer: req.token.id,
  });

  // The DB trigger `change_guideline` automatically inserts a `t_last_change` row on restore
  // (which is an UPDATE). We update that row's author here to specify the moderator/reviewer.
  await RecentChangeService.setDeleteRestoreAuthor(
    'restore',
    'guideline',
    guidelineId,
    req.token.id
  );

  const populatedGuideline = await GuidelineService.getGuideline(guidelineId);

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedGuideline,
    { controllerMethod: 'GuidelineController.restore' },
    res,
    toSimpleGuideline
  );
};
