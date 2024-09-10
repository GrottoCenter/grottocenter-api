const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const CommentService = require('../../../services/CommentService');
const ParametersValidatorService = require('../../../services/ParametersValidatorService');
const { toSimpleComment } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
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
    ['entrance']
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
    NotificationService.NOTIFICATION_TYPES.CREATE,
    NotificationService.NOTIFICATION_ENTITIES.COMMENT
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedComment,
    { controllerMethod: 'CommentController.create' },
    res,
    toSimpleComment
  );
};
