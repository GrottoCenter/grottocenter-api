const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const CommentService = require('../../../services/CommentService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const { toSimpleComment } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const mandatoryParams = ParametersValidatorService.checkAllExist(req, res, [
      'body',
      'title',
      'language',
    ]);
    if (!mandatoryParams) return null;
    const [body, title, language] = mandatoryParams;

    const linkedEntity = await ParametersValidatorService.checkOneOfEntityExist(
      req,
      res,
      ['cave', 'entrance']
    );
    if (!linkedEntity) return null;

    const newComment = await TComment.create({
      author: req.token.id,
      body,
      title,
      eTUnderground: req.param('eTUnderground', null),
      eTTrail: req.param('eTTrail', null),
      aestheticism: req.param('aestheticism', null),
      caving: req.param('caving', null),
      approach: req.param('approach', null),
      dateInscription: new Date(),
      language,
      [linkedEntity.type]: linkedEntity.id,
      // TODO compute relevance
    }).fetch();

    const populatedComment = await CommentService.getComment(newComment.id);
    await NotificationService.notifySubscribers(
      req,
      populatedComment,
      req.token.id,
      NOTIFICATION_TYPES.CREATE,
      NOTIFICATION_ENTITIES.COMMENT
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedComment,
      { controllerMethod: 'CommentController.create' },
      res,
      toSimpleComment
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
