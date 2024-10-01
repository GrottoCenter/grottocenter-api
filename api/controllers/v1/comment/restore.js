const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const CommentService = require('../../../services/CommentService');
const { toSimpleComment } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to restore comment.');

  const commentId = req.param('id');
  const comment = await CommentService.getComment(commentId);
  if (!comment || !comment.isDeleted) {
    return res.notFound({
      message: `Comment of id ${commentId} not found or not deleted.`,
    });
  }

  await TComment.updateOne({ id: commentId }).set({ isDeleted: false });
  comment.isDeleted = false;

  await RecentChangeService.setDeleteRestoreAuthor(
    'restore',
    'comment',
    commentId,
    req.token.id
  );

  await NotificationService.notifySubscribers(
    req,
    comment,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.COMMENT
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    comment,
    { controllerMethod: 'CommentController.restore' },
    res,
    toSimpleComment
  );
};
