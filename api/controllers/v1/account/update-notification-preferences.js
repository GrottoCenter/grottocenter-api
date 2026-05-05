/**
 * AccountController.updateNotificationPreferences
 *
 * @description :: Update notification preferences for the authenticated caver.
 * @help        :: See https://sailsjs.com/documentation/concepts/controllers
 */

module.exports = async (req, res) => {
  try {
    const caverId = req.token.id;
    const {
      alertForNews,
      sendNotificationByEmail,
      sendMessageNotificationByEmail,
    } = req.allParams();

    const updateData = {};

    if (alertForNews !== undefined) {
      if (
        typeof alertForNews !== 'boolean' &&
        alertForNews !== 'true' &&
        alertForNews !== 'false'
      ) {
        return res.badRequest(
          "You must provide an alertForNews value ('true' or 'false' or boolean)."
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
          "You must provide a sendNotificationByEmail value ('true' or 'false' or boolean)."
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
          "You must provide a sendMessageNotificationByEmail value ('true' or 'false' or boolean)."
        );
      }
      updateData.sendMessageNotificationByEmail =
        sendMessageNotificationByEmail === true ||
        sendMessageNotificationByEmail === 'true';
    }

    if (Object.keys(updateData).length === 0) {
      return res.badRequest('No notification preferences provided to update.');
    }

    const updatedCaver = await TCaver.updateOne({ id: caverId }).set(
      updateData
    );

    if (!updatedCaver) {
      return res.notFound({
        message: `Caver with id ${caverId} not found.`,
      });
    }

    return res.ok({
      alertForNews: updatedCaver.alertForNews,
      sendNotificationByEmail: updatedCaver.sendNotificationByEmail,
      sendMessageNotificationByEmail:
        updatedCaver.sendMessageNotificationByEmail,
    });
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An error occurred while updating notification preferences.'
    );
  }
};
