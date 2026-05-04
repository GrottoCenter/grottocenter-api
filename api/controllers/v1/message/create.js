const MessageService = require('../../../services/MessageService');
const ControllerService = require('../../../services/ControllerService');
const CommonService = require('../../../services/CommonService');

/**
 * MessageController.create
 *
 * @description :: Send a private message.
 * @help        :: See https://sailsjs.com/documentation/concepts/controllers
 */

module.exports = async (req, res) => {
  const senderId = req.token.id;
  const recipientId = req.param('recipientId');
  const conversationId = req.param('conversationId');
  const body = req.param('body');

  // Validation
  if (!body || body.trim().length === 0) {
    return res.badRequest('Message body cannot be empty.');
  }
  if (body.length > 5000) {
    return res.badRequest('Message body cannot exceed 5000 characters.');
  }

  let finalConversationId;

  // 1. Resolve Conversation or Recipient Eligibility
  if (conversationId) {
    try {
      const queryResult = await CommonService.query(
        'SELECT 1 FROM j_participant WHERE id_conversation = $1 AND id_caver = $2',
        [conversationId, senderId]
      );

      if (queryResult.rows.length === 0) {
        return res.forbidden('You are not a participant in this conversation.');
      }
      finalConversationId = conversationId;
    } catch (err) {
      sails.log.error(err);
      return res.serverError(
        'An error occurred while verifying conversation membership.'
      );
    }
  } else if (recipientId) {
    if (Number(recipientId) === Number(senderId)) {
      return res.badRequest('You cannot send a message to yourself.');
    }

    try {
      await MessageService.getEligibleRecipient(recipientId);
    } catch (err) {
      if (err.code === 'E_NOT_FOUND') {
        return res.notFound(err.message);
      }
      if (err.code === 'E_FORBIDDEN') {
        return res.forbidden(err.message);
      }
      sails.log.error(err);
      return res.serverError(
        'An error occurred while verifying the recipient.'
      );
    }

    // 2. Resolve/Create Conversation for the Recipient
    try {
      finalConversationId = await MessageService.findExistingConversation(
        senderId,
        recipientId
      );
      if (!finalConversationId) {
        const newConvo = await MessageService.createConversation(
          senderId,
          recipientId
        );
        finalConversationId = newConvo.id;
      }
    } catch (err) {
      sails.log.error(err);
      return res.serverError(
        'An error occurred while establishing the conversation.'
      );
    }
  } else {
    return res.badRequest(
      'You must provide either a recipientId or a conversationId.'
    );
  }

  // 3. Create the message
  try {
    const newMessage = await TMessage.create({
      conversation: finalConversationId,
      caverSender: senderId,
      body: body.trim(),
      dateSent: new Date(),
    }).fetch();

    return ControllerService.treat(
      req,
      null,
      newMessage,
      { controllerMethod: 'MessageController.create' },
      res
    );
  } catch (err) {
    sails.log.error(err);
    return res.serverError('An error occurred while sending the message.');
  }
};
