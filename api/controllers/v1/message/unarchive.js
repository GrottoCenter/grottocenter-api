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
    });

    if (!updated) {
      return res.notFound(
        sails.helpers.formatMessagingError(
          req,
          'Conversation not found or you are not a participant.',
          'E_NOT_FOUND'
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
