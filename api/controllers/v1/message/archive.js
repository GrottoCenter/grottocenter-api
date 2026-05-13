/**
 * MessageController.archive
 *
 * @description :: Archive a conversation for the authenticated caver.
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
        sails.helpers.formatStructuredError(
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
        sails.helpers.formatStructuredError(
          req,
          'You are not a participant in this conversation.',
          'E_AUTHORIZATION'
        )
      );
    }

    await TConversationArchive.findOrCreate(
      { conversation: conversationId, caver: caverId },
      { conversation: conversationId, caver: caverId, archivedAt: new Date() }
    );

    return res.status(204).send();
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      sails.helpers.formatStructuredError(
        req,
        'An error occurred while archiving the conversation.',
        'E_SERVER_ERROR'
      )
    );
  }
};
