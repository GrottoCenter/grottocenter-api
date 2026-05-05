const MessageService = require('../../../services/MessageService');
const ControllerService = require('../../../services/ControllerService');

/**
 * MessageController.listConversations
 *
 * @description :: List active conversations for the authenticated caver.
 * @help        :: See https://sailsjs.com/documentation/concepts/controllers
 */

const DEFAULT_SIZE = 20;
const MAX_SIZE = 50;

module.exports = async (req, res) => {
  const caverId = req.token.id;
  const limit = req.param('limit')
    ? Math.min(parseInt(req.param('limit'), 10), MAX_SIZE)
    : DEFAULT_SIZE;
  const skip = parseInt(req.param('skip', 0), 10);

  try {
    const conversations = await MessageService.listConversations(
      caverId,
      'active',
      skip,
      limit
    );
    const total = await MessageService.countConversations(caverId, 'active');

    const params = {
      controllerMethod: 'MessageController.listConversations',
      limit,
      maxRange: MAX_SIZE,
      searchedItem: 'Conversations',
      skip,
      total,
      url: req.originalUrl,
    };

    return ControllerService.treatAndConvert(
      req,
      null,
      conversations,
      params,
      res,
      (data) => ({ conversations: data })
    );
  } catch (err) {
    sails.log.error(err);
    return res.serverError(
      sails.helpers.formatMessagingError(
        req,
        'An error occurred while listing conversations.',
        'E_SERVER_ERROR'
      )
    );
  }
};
