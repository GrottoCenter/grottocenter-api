const ControllerService = require('../../../services/ControllerService');
const { toSimplePoint } = require('../../../services/mapping/converters');
const readPageParams = require('../../../utils/readPageParams');

module.exports = async (req, res) => {
  const pagination = readPageParams(req.param('page'), req.param('size'));
  if (pagination.error) return res.badRequest(pagination.error);
  const { page, size, skip } = pagination;

  const where = { isDeleted: false };
  const caveId = req.param('caveId');
  if (caveId !== undefined) {
    const num = Number(caveId);
    if (!Number.isInteger(num) || num < 1) {
      return res.badRequest('caveId must be a positive integer.');
    }
    where.cave = num;
  }

  // Sorted by id, unique: a page always holds the same points.
  const [total, points] = await Promise.all([
    TPoint.count(where),
    TPoint.find(where).sort('id ASC').skip(skip).limit(size),
  ]);

  return ControllerService.treatAndConvert(
    req,
    null,
    points,
    {
      controllerMethod: 'PointController.findAll',
      searchedItem: 'All points',
    },
    res,
    (data) => ({ points: data.map(toSimplePoint), page, size, total })
  );
};
