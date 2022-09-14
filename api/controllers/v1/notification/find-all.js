const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const NotificationService = require('../../../services/NotificationService');

const MAX_SIZE = 50;

module.exports = async (req, res) => {
  // Extract parameters
  const size = req.param('limit')
    ? Math.min(req.param('limit'), MAX_SIZE)
    : MAX_SIZE;

  const sort = `${req.param('sortBy', 'dateInscription')} ${req.param(
    'orderBy',
    'DESC'
  )}`;
  const skip = req.param('skip', 0);
  const whereClause = {
    notified: req.token.id,
  };

  try {
    const notifications = await TNotification.find()
      .where(whereClause)
      .skip(skip)
      .limit(size)
      .sort(sort)
      .populate('cave')
      .populate('document')
      .populate('description')
      .populate('entrance')
      .populate('grotto')
      .populate('location')
      .populate('massif')
      .populate('notificationType')
      .populate('notified')
      .populate('notifier');

    const populatedNotifications = await Promise.all(
      notifications.map(async (n) => {
        const result = await NotificationService.populateEntities(n);
        return result;
      })
    );

    const countFound = await TNotification.count().where(whereClause);

    const params = {
      controllerMethod: 'Notification.findAll',
      limit: req.param('limit', 50),
      maxRange: MAX_SIZE,
      searchedItem: 'Notification',
      skip: req.param('skip', 0),
      total: countFound,
      url: req.originalUrl,
    };
    return ControllerService.treatAndConvert(
      req,
      undefined,
      populatedNotifications,
      params,
      res,
      MappingService.convertToNotificationList
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
