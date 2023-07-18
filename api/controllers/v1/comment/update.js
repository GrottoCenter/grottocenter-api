const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const CommentService = require('../../../services/CommentService');
const { toSimpleComment } = require('../../../services/mapping/converters');

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

    if (req.token.id !== rawComment.author) {
      const hasRight = RightService.hasGroup(
        req.token.groups,
        RightService.G.MODERATOR
      );

      if (!hasRight) {
        return res.forbidden('You are not authorized to update any comment.');
      }
    }

    const newTitle = req.param('title');
    const newBody = req.param('body');
    const newLanguage = req.param('language');
    const newETUnderground = req.param('eTUnderground', null);
    const newETTrail = req.param('eTTrail', null);
    const newAestheticism = req.param('aestheticism', null);
    const newCaving = req.param('caving', null);
    const newApproach = req.param('approach', null);

    const updatedFields = {
      reviewer: req.token.id,
      // dateReviewed will be updated automaticly by the SQL historisation trigger
    };

    if (newTitle) updatedFields.title = newTitle;
    if (newBody) updatedFields.body = newBody;
    if (newLanguage) updatedFields.language = newLanguage;

    // To enable erasure, these parameters are mandatory
    updatedFields.eTUnderground = newETUnderground;
    updatedFields.eTTrail = newETTrail;
    updatedFields.aestheticism = newAestheticism;
    updatedFields.caving = newCaving;
    updatedFields.approach = newApproach;

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
      toSimpleComment
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
