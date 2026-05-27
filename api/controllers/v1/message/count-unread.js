/**
 * MessageController.countUnread
 *
 * @description :: Get unread message counts (active and archived) for the authenticated caver.
 * @help        :: See https://sailsjs.com/documentation/concepts/controllers
 */

module.exports = async (req, res) => {
  const caverId = req.token.id;

  try {
    const counts = await MessageService.getUnreadCounts(caverId);
    return res.ok(counts);
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      sails.helpers.formatStructuredError(
        req,
        'An error occurred while counting unread messages.',
        'E_SERVER_ERROR'
      )
    );
  }
};
