/**
 * MessageController.getMessages
 *
 * @description :: Get messages in a conversation (paginated, marks as read).
 * @help        :: See https://sailsjs.com/documentation/concepts/controllers
 */

const DEFAULT_SIZE = 20;
const MAX_SIZE = 50;

module.exports = async (req, res) => {
  const caverId = req.token.id;
  const conversationId = req.param('id');
  const limit = req.param('limit')
    ? Math.min(parseInt(req.param('limit'), 10), MAX_SIZE)
    : DEFAULT_SIZE;
  const skip = parseInt(req.param('skip', 0), 10);

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

    const messages = await MessageService.getMessages(
      conversationId,
      skip,
      limit,
      caverId
    );
    const total = await MessageService.countMessages(conversationId);

    const params = {
      controllerMethod: 'MessageController.getMessages',
      limit,
      maxRange: MAX_SIZE,
      searchedItem: 'Messages',
      skip,
      total,
      url: req.originalUrl,
    };

    return ControllerService.treatAndConvert(
      req,
      null,
      messages,
      params,
      res,
      (data) => ({ messages: data })
    );
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      sails.helpers.formatStructuredError(
        req,
        'An error occurred while fetching messages.',
        'E_SERVER_ERROR'
      )
    );
  }
};
