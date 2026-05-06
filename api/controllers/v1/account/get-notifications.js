/**
 * AccountController.getNotificationPreferences
 *
 * @description :: Get notification preferences for the authenticated caver.
 * @help        :: See https://sailsjs.com/documentation/concepts/controllers
 */

module.exports = async (req, res) => {
  try {
    const caverId = req.token.id;
    const caver = await TCaver.findOne({ id: caverId });

    if (!caver) {
      return res.notFound(
        sails.helpers.formatMessagingError(
          req,
          `Caver with id ${caverId} not found.`,
          'E_NOT_FOUND'
        )
      );
    }

    return res.ok({
      alert_for_news: caver.alertForNews,
      send_notification_by_email: caver.sendNotificationByEmail,
      send_message_notification_by_email: caver.sendMessageNotificationByEmail,
    });
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      sails.helpers.formatMessagingError(
        req,
        'An error occurred while retrieving notification preferences.',
        'E_SERVER_ERROR'
      )
    );
  }
};
