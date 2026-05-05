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
      return res.notFound({ error: `Caver with id ${caverId} not found.` });
    }

    return res.ok({
      alertForNews: caver.alertForNews,
      sendNotificationByEmail: caver.sendNotificationByEmail,
      sendMessageNotificationByEmail: caver.sendMessageNotificationByEmail,
    });
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      'An error occurred while retrieving notification preferences.'
    );
  }
};
