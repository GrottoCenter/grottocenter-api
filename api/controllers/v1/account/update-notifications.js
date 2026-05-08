/**
 * AccountController.updateNotifications
 *
 * @description :: Update notification preferences for the authenticated caver.
 * @help        :: See https://sailsjs.com/documentation/concepts/controllers
 */

module.exports = async (req, res) => {
  try {
    const caverId = req.token.id;
    const params = req.allParams();
    const alertForNews = params.alert_for_news;
    const sendNotificationByEmail = params.send_notification_by_email;
    const sendMessageNotificationByEmail =
      params.send_message_notification_by_email;

    const updateData = {};

    if (alertForNews !== undefined) {
      if (
        typeof alertForNews !== 'boolean' &&
        alertForNews !== 'true' &&
        alertForNews !== 'false'
      ) {
        return res.badRequest(
          sails.helpers.formatStructuredError(
            req,
            "You must provide an alert_for_news value ('true' or 'false' or boolean).",
            'E_BAD_REQUEST'
          )
        );
      }
      updateData.alertForNews =
        alertForNews === true || alertForNews === 'true';
    }

    if (sendNotificationByEmail !== undefined) {
      if (
        typeof sendNotificationByEmail !== 'boolean' &&
        sendNotificationByEmail !== 'true' &&
        sendNotificationByEmail !== 'false'
      ) {
        return res.badRequest(
          sails.helpers.formatStructuredError(
            req,
            "You must provide a send_notification_by_email value ('true' or 'false' or boolean).",
            'E_BAD_REQUEST'
          )
        );
      }
      updateData.sendNotificationByEmail =
        sendNotificationByEmail === true || sendNotificationByEmail === 'true';
    }

    if (sendMessageNotificationByEmail !== undefined) {
      if (
        typeof sendMessageNotificationByEmail !== 'boolean' &&
        sendMessageNotificationByEmail !== 'true' &&
        sendMessageNotificationByEmail !== 'false'
      ) {
        return res.badRequest(
          sails.helpers.formatStructuredError(
            req,
            "You must provide a send_message_notification_by_email value ('true' or 'false' or boolean).",
            'E_BAD_REQUEST'
          )
        );
      }
      updateData.sendMessageNotificationByEmail =
        sendMessageNotificationByEmail === true ||
        sendMessageNotificationByEmail === 'true';
    }

    if (Object.keys(updateData).length === 0) {
      return res.badRequest(
        sails.helpers.formatStructuredError(
          req,
          'No notification preferences provided to update.',
          'E_BAD_REQUEST'
        )
      );
    }

    const updatedCaver = await TCaver.updateOne({ id: caverId }).set(
      updateData
    );

    if (!updatedCaver) {
      return res.notFound(
        sails.helpers.formatStructuredError(
          req,
          `Caver with id ${caverId} not found.`,
          'E_NOT_FOUND'
        )
      );
    }

    return res.ok({
      alert_for_news: updatedCaver.alertForNews,
      send_notification_by_email: updatedCaver.sendNotificationByEmail,
      send_message_notification_by_email:
        updatedCaver.sendMessageNotificationByEmail,
    });
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      sails.helpers.formatStructuredError(
        req,
        'An error occurred while updating notification preferences.',
        'E_SERVER_ERROR'
      )
    );
  }
};
