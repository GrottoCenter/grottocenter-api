/**
 * AccountController.updateNotifications
 *
 * @description :: Update notification preferences for the authenticated caver.
 * @help        :: See https://sailsjs.com/documentation/concepts/controllers
 */

const readBoolParam = require('../../../utils/readBoolParam');

// Request parameter → TCaver attribute.
const NOTIFICATION_PARAMS = [
  ['alert_for_news', 'alertForNews'],
  ['send_notification_by_email', 'sendNotificationByEmail'],
  ['send_message_notification_by_email', 'sendMessageNotificationByEmail'],
];

module.exports = async (req, res) => {
  try {
    const caverId = req.token.id;
    const updateData = {};
    for (const [param, attribute] of NOTIFICATION_PARAMS) {
      const { value, error } = readBoolParam(req, param);
      if (error) return res.badRequest(error);
      if (value !== undefined) updateData[attribute] = value;
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
