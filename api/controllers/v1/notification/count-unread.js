const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  try {
    const result = await TNotification.count().where({
      dateReadAt: null,
      notified: req.token.id,
    });

    const params = {
      controllerMethod: 'Notification.count-unread',
    };

    const count = {
      count: result,
    };
    return ControllerService.treat(req, null, count, params, res);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
