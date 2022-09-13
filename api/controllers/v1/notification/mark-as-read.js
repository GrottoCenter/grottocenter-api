const ErrorService = require('../../../services/ErrorService');

const { checkIfExists } = sails.helpers;
module.exports = async (req, res) => {
  const notificationId = req.param('notificationId');
  if (!(await checkIfExists('id', notificationId, TNotification))) {
    return res.notFound({
      message: `Notification with id ${notificationId} not found.`,
    });
  }

  const notification = await TNotification.findOne(notificationId);
  if (notification.notified !== Number(req.token.id)) {
    return res.forbidden(
      "You can not mark as read a notification which doesn't belong to you."
    );
  }

  try {
    await TNotification.updateOne(
      {
        id: notificationId,
      },
      { dateReadAt: new Date() }
    );
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
