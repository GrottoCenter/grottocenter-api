const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const CommentService = require('../../../services/CommentService');
const { toComment } = require('../../../services/mapping/converters');

const { checkRight } = sails.helpers;

module.exports = async (req, res) => {
  try {
    const commentId = req.param('id');
    const rawComment = await TComment.findOne(commentId);
    // TODO How to delete/restore entity ?
    if (!rawComment || rawComment.isDeleted) {
      return res.notFound({
        message: `Comment of id ${commentId} not found.`,
      });
    }

    const hasRight = await checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.COMMENT,
        rightAction:
          req.token.id === rawComment.author
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

    const newTitle = req.param('title');
    const newBody = req.param('body');
    const newLanguage = req.param('language');
    const newETUnderground = req.param('eTUnderground');
    const newETTrail = req.param('eTTrail');
    const newAestheticism = req.param('aestheticism');
    const newCaving = req.param('caving');
    const newApproach = req.param('approach');

    const updatedFields = {
      reviewer: req.token.id,
      // dateReviewed will be updated automaticly by the SQL historisation trigger
    };

    if (newTitle) updatedFields.title = newTitle;
    if (newBody) updatedFields.body = newBody;
    if (newLanguage) updatedFields.language = newLanguage;
    if (newETUnderground) updatedFields.eTUnderground = newETUnderground;
    if (newETTrail) updatedFields.eTTrail = newETTrail;
    if (newAestheticism) updatedFields.aestheticism = newAestheticism;
    if (newCaving) updatedFields.caving = newCaving;
    if (newApproach) updatedFields.approach = newApproach;
    // TODO re-compute relevance ?

    await TComment.updateOne({ id: commentId }).set(updatedFields);

    const populatedComment = await CommentService.getComment(commentId);
    await NotificationService.notifySubscribers(
      req,
      populatedComment,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.COMMENT
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedComment,
      { controllerMethod: 'CommentController.update' },
      res,
      toComment
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
