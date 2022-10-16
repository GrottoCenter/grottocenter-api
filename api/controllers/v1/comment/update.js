const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');

const { checkRight } = sails.helpers;

module.exports = async (req, res) => {
  // Check right and if comment exists
  const commentId = req.param('id');
  const existingComment = await TComment.findOne(commentId);
  if (!existingComment)
    return res.notFound({
      message: `Comment of id ${commentId} not found.`,
    });

  const hasRight = await checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.COMMENT,
      rightAction:
        req.token.id === existingComment.author
          ? RightService.RightActions.EDIT_OWN
          : RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update any comment.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update any/own comment.');
  }
  const newBody = req.param('body');
  const newTitle = req.param('title');
  const newETUnderground = req.param('eTUnderground', null);
  const newETTrail = req.param('eTTrail', null);
  const newAestheticism = req.param('aestheticism', null);
  const newCaving = req.param('caving', null);
  const newApproach = req.param('approach', null);
  const newLanguage = req.param('language');
  const cleanedData = {
    ...(newBody && { body: newBody }),
    ...(newTitle && { title: newTitle }),
    reviewer: req.token.id,
    eTUnderground: newETUnderground,
    eTTrail: newETTrail,
    aestheticism: newAestheticism,
    caving: newCaving,
    approach: newApproach,
    ...(newLanguage && { language: newLanguage }),
  };
  try {
    await TComment.updateOne({
      id: commentId,
    }).set(cleanedData);
    const tempComment = await TComment.findOne(commentId)
      .populate('author')
      .populate('entrance')
      .populate('cave')
      .populate('language')
      .populate('reviewer');

    // Populate nested entities too
    const populatedComment = tempComment.entrance
      ? {
          ...tempComment,
          entrance: {
            ...(await TEntrance.findOne(tempComment.entrance.id).populate(
              'cave'
            )),
          },
        }
      : tempComment;

    await NotificationService.notifySubscribers(
      req,
      populatedComment,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.COMMENT
    );

    const params = {};
    params.controllerMethod = 'CommentController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      populatedComment,
      params,
      res,
      MappingService.convertToCommentModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
