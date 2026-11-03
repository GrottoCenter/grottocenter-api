const ControllerService = require('../../../services/ControllerService');
const { toSimplePoint } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const readNonNegativeInt = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 ? num : null;
};

module.exports = async (req, res) => {
  const skip = readNonNegativeInt(req.param('skip'), 0);
  if (skip === null) {
    return res.badRequest('skip must be a non-negative integer.');
  }
  const limit = readNonNegativeInt(req.param('limit'), DEFAULT_LIMIT);
  if (limit === null || limit < 1 || limit > MAX_LIMIT) {
    return res.badRequest(
      `limit must be an integer between 1 and ${MAX_LIMIT}.`
    );
  }

  const where = { isDeleted: false };
  const caveId = req.param('caveId');
  if (caveId !== undefined) {
    const num = Number(caveId);
    if (!Number.isInteger(num) || num < 1) {
      return res.badRequest('caveId must be a positive integer.');
    }
    where.cave = num;
  }

  const [total, points] = await Promise.all([
    TPoint.count(where),
    TPoint.find(where).sort('id ASC').skip(skip).limit(limit),
  ]);

  return ControllerService.treatAndConvert(
    req,
    null,
    points,
    {
      controllerMethod: 'PointController.findAll',
      searchedItem: 'All points',
      limit,
      skip,
      total,
      url: req.originalUrl,
    },
    res,
    (data) => toListFromController('points', data, toSimplePoint)
  );
};
