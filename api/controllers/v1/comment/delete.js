const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const { toSimpleComment } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const CommentService = require('../../../services/CommentService');
const RecentChangeService = require('../../../services/RecentChangeService');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to delete comment.');

  // Read before any write: an invalid value must not leave a half-done delete.
  const { value: deletePermanently, error: isPermanentError } = readBoolParam(
    req,
    'isPermanent',
    false
  );
  if (isPermanentError) return res.badRequest(isPermanentError);

  const commentId = req.param('id');
  const comment = await CommentService.getComment(commentId);
  if (!comment) {
    return res.notFound({ message: `Comment of id ${commentId} not found.` });
  }

  if (!comment.isDeleted) {
    await TComment.destroyOne({ id: commentId }); // Soft delete
    comment.isDeleted = true;

    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'comment',
      commentId,
      req.token.id
    );
  }

  if (deletePermanently) {
    await HComment.destroy({ t_id: commentId });
    await TNotification.destroy({ comment: commentId });
    await TComment.destroyOne({ id: commentId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    comment,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.COMMENT
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    comment,
    { controllerMethod: 'CommentController.delete' },
    res,
    toSimpleComment
  );
};
