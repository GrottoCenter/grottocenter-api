/**
 * MessageController.archive
 *
 * @description :: Archive a conversation for the authenticated caver.
 */

module.exports = async (req, res) => {
  const caverId = req.token.id;
  const conversationId = req.params.id;

  try {
    const conversationExists = await TConversation.count({
      id: conversationId,
    });
    if (!conversationExists) {
      return res.notFound(
        sails.helpers.formatMessagingError(
          req,
          'Conversation not found.',
          'E_NOT_FOUND'
        )
      );
    }

    const updated = await JParticipant.updateOne({
      conversation: conversationId,
      caver: caverId,
    }).set({
      state: 'archived',
      archivedAt: new Date(),
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
        'An error occurred while archiving the conversation.',
        'E_SERVER_ERROR'
      )
    );
  }
};
