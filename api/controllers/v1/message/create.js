const MessageService = require('../../../services/MessageService');
const ControllerService = require('../../../services/ControllerService');
const CommonService = require('../../../services/CommonService');
const NotificationService = require('../../../services/NotificationService');

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
    return res.badRequest(
      sails.helpers.formatStructuredError(
        req,
        'Message body cannot be empty.',
        'E_VALIDATION'
      )
    );
  }
  if (body.length > 5000) {
    return res.badRequest(
      sails.helpers.formatStructuredError(
        req,
        'Message body cannot exceed 5000 characters.',
        'E_VALIDATION'
      )
    );
  }

  let finalConversationId;

  // 1. Resolve Conversation or Recipient Eligibility
  if (conversationId) {
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

      const queryResult = await CommonService.query(
        'SELECT 1 FROM j_participant WHERE id_conversation = $1 AND id_caver = $2',
        [conversationId, senderId]
      );

      if (queryResult.rows.length === 0) {
        return res.forbidden(
          sails.helpers.formatStructuredError(
            req,
            'You are not a participant in this conversation.',
            'E_AUTHORIZATION'
          )
        );
      }

      // Check if the other participant is still eligible
      const otherParticipantId = await MessageService.getOtherParticipantId(
        conversationId,
        senderId
      );
      if (otherParticipantId) {
        try {
          await MessageService.getEligibleRecipient(otherParticipantId);
        } catch (err) {
          if (err.code === 'E_NOT_FOUND') {
            return res.notFound(
              sails.helpers.formatStructuredError(
                req,
                err.message,
                'E_NOT_FOUND'
              )
            );
          }
          if (err.code === 'E_FORBIDDEN') {
            return res.forbidden(
              sails.helpers.formatStructuredError(
                req,
                err.message,
                'E_AUTHORIZATION'
              )
            );
          }
          throw err;
        }
      }

      finalConversationId = conversationId;
    } catch (err) {
      sails.log.error(err);
      return res.serverError(
        sails.helpers.formatStructuredError(
          req,
          'An error occurred while verifying conversation membership.',
          'E_SERVER_ERROR'
        )
      );
    }
  } else if (recipientId) {
    if (Number(recipientId) === Number(senderId)) {
      return res.badRequest(
        sails.helpers.formatStructuredError(
          req,
          'You cannot send a message to yourself.',
          'E_VALIDATION'
        )
      );
    }

    try {
      await MessageService.getEligibleRecipient(recipientId);
    } catch (err) {
      if (err.code === 'E_NOT_FOUND') {
        return res.notFound(
          sails.helpers.formatStructuredError(req, err.message, 'E_NOT_FOUND')
        );
      }
      if (err.code === 'E_FORBIDDEN') {
        return res.forbidden(
          sails.helpers.formatStructuredError(
            req,
            err.message,
            'E_AUTHORIZATION'
          )
        );
      }
      sails.log.error(err);
      return res.serverError(
        sails.helpers.formatStructuredError(
          req,
          'An error occurred while verifying the recipient.',
          'E_SERVER_ERROR'
        )
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
        sails.helpers.formatStructuredError(
          req,
          'An error occurred while establishing the conversation.',
          'E_SERVER_ERROR'
        )
      );
    }
  } else {
    return res.badRequest(
      sails.helpers.formatStructuredError(
        req,
        'You must provide either a recipientId or a conversationId.',
        'E_VALIDATION'
      )
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

    // Notify recipient (non-blocking)
    // Errors are handled inside the service to avoid affecting message creation
    NotificationService.notifyMessageRecipient(
      req,
      senderId,
      finalConversationId
    ).catch((err) => {
      sails.log.error('Background notification failed:', err);
    });

    return ControllerService.treat(
      req,
      null,
      MessageService.formatMessage(newMessage),
      { controllerMethod: 'MessageController.create' },
      res
    );
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      sails.helpers.formatStructuredError(
        req,
        'An error occurred while sending the message.',
        'E_SERVER_ERROR'
      )
    );
  }
};
