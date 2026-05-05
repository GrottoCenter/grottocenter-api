/**
 * MessageController.unarchive
 *
 * @description :: Unarchive a conversation for the authenticated caver.
 */

module.exports = async (req, res) => {
  const caverId = req.token.id;
  const conversationId = req.params.id;

  try {
    const updated = await JParticipant.updateOne({
      conversation: conversationId,
      caver: caverId,
    }).set({
      state: 'active',
      archivedAt: null,
    });

    if (!updated) {
      return res.forbidden(
        sails.helpers.formatMessagingError(
          req,
          'You are not a participant in this conversation or it does not exist.',
          'E_FORBIDDEN'
        )
      );
    }

    return res.ok();
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      sails.helpers.formatMessagingError(
        req,
        'An error occurred while unarchiving the conversation.',
        'E_SERVER_ERROR'
      )
    );
  }
};
