module.exports = async (req, res) => {
  const notificationId = req.param('notificationId');
  const notification = await TNotification.findOne(notificationId);
  if (!notification) {
    return res.notFound({
      message: `Notification with id ${notificationId} not found.`,
    });
  }
  if (notification.notified !== Number(req.token.id)) {
    return res.forbidden(
      "You can not mark as read a notification which doesn't belong to you."
    );
  }

  await TNotification.updateOne(
    { id: notificationId },
    { dateReadAt: new Date() }
  );
  return res.ok();
};
