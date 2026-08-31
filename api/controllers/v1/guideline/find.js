const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const { toGuideline } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const guidelineId = req.param('id');
  const guideline = await GuidelineService.getGuidelineDetail(guidelineId);
  if (!guideline || guideline.isDeleted) {
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
