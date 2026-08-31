const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const guidelineId = req.param('id');
  const guideline = await GuidelineService.getGuideline(guidelineId);
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
    toSimpleGuideline
  );
};
