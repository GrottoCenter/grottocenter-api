const ControllerService = require('../../../services/ControllerService');
const GuidelineService = require('../../../services/GuidelineService');
const { toSimpleGuideline } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const entityType = req.param('entityType');
  const entityId = req.param('entityId');

  const validEntityTypes = GuidelineService.VALID_ENTITY_TYPES;
  if (!validEntityTypes.includes(entityType)) {
    return res.badRequest({
      message: `Invalid entityType. Must be one of: ${validEntityTypes.join(', ')}`,
    });
  }

  const guidelines = await GuidelineService.getGuidelinesForEntity(
    entityType,
    entityId
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    guidelines,
    { controllerMethod: 'GuidelineController.findForEntity' },
    res,
    (data) => data.map(toSimpleGuideline)
  );
};
