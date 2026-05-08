/**
 * MessageController.unarchive
 *
 * @description :: Unarchive a conversation for the authenticated caver.
 */

const MessageService = require('../../../services/MessageService');

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

    const isParticipant = await MessageService.isParticipant(
      conversationId,
      caverId
    );
    if (!isParticipant) {
      return res.forbidden(
        sails.helpers.formatMessagingError(
          req,
          'You are not a participant in this conversation or it does not exist.',
          'E_AUTHORIZATION'
        )
      );
    }

    await TConversationArchive.destroyOne({
      conversation: conversationId,
      caver: caverId,
    });

    return res.status(204).send();
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
