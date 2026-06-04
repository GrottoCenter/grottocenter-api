const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleGuideline } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const guidelineId = Number(req.param('id'));
  if (Number.isNaN(guidelineId)) {
    return res.badRequest({ message: 'Guideline ID must be a number.' });
  }

  const snapshots = await GuidelineService.getGuidelineHistory(guidelineId);

  if (!snapshots || snapshots.length === 0) {
    return res.notFound({
      message: `Guideline ${guidelineId} has no history snapshots.`,
    });
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    snapshots,
    { controllerMethod: 'GuidelineController.getSnapshots' },
    res,
    (data) => toListFromController('guidelines', data, toSimpleGuideline)
  );
};
