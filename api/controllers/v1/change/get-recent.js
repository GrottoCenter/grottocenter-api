const ControllerService = require('../../../services/ControllerService');
const RecentChangeService = require('../../../services/RecentChangeService');

module.exports = async (req, res) => {
  let offset = parseInt(req.param('offset'), 10);
  if (Number.isNaN(offset)) offset = 0;
  let limit = parseInt(req.param('limit'), 10);
  if (Number.isNaN(limit)) limit = 10;
  const start = offset >= 0 ? offset : offset - limit;
  const end = offset >= 0 ? offset + limit : offset;

  const changes = await RecentChangeService.getRecent();

  return ControllerService.treat(
    req,
    null,
    { changes: changes.slice(start, end) },
    {
      controllerMethod: 'ChangeController.getRecent',
      notFoundMessage: 'Problem while getting the recent changes',
    },
    res
  );
};
