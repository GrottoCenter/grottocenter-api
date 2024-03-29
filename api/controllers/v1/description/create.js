const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const NotificationService = require('../../../services/NotificationService');
const DescriptionService = require('../../../services/DescriptionService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const { toSimpleDescription } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const mandatoryParams = ParametersValidatorService.checkAllExist(req, res, [
      'title',
      'body',
      'language',
    ]);
    if (!mandatoryParams) return null;
    const [title, body, language] = mandatoryParams;

    const linkedEntity = await ParametersValidatorService.checkOneOfEntityExist(
      req,
      res,
      ['cave', 'document', 'entrance', 'exit', 'massif', 'point']
    );
    if (!linkedEntity) return null;

    const newDescription = await TDescription.create({
      author: req.token.id,
      dateInscription: new Date(),
      body,
      title,
      language,
      [linkedEntity.type]: linkedEntity.id,
      // TODO compute relevance
    }).fetch();

    const populatedDescription = await DescriptionService.getDescription(
      newDescription.id
    );

    await NotificationService.notifySubscribers(
      req,
      populatedDescription,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.DESCRIPTION
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedDescription,
      { controllerMethod: 'DescriptionController.create' },
      res,
      toSimpleDescription
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
