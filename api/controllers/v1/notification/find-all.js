const ControllerService = require('../../../services/ControllerService');
const { toNotification } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');
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

  const notifications = await TNotification.find()
    .where(whereClause)
    .skip(skip)
    .limit(size)
    .sort(sort)
    .populate('cave')
    .populate('comment')
    .populate('document')
    .populate('description')
    .populate('entrance')
    .populate('grotto')
    .populate('history')
    .populate('location')
    .populate('massif')
    .populate('notificationType')
    .populate('notified')
    .populate('notifier')
    .populate('rigging');

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
    (data, meta) =>
      toListFromController('notifications', data, toNotification, { meta })
  );
};
