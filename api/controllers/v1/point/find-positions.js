const ControllerService = require('../../../services/ControllerService');
const PointService = require('../../../services/PointService');
const RightService = require('../../../services/RightService');
const { toPointPosition } = require('../../../services/mapping/converters');
const readPageParams = require('../../../utils/readPageParams');

module.exports = async (req, res) => {
  const pointId = Number(req.param('id'));

  const pagination = readPageParams(req.param('page'), req.param('size'));
  if (pagination.error) return res.badRequest(pagination.error);
  const { page, size, skip } = pagination;

  // Same visibility as GET /points/:id. Public endpoint: req.token is only set
  // for an authenticated request.
  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );
  const point = await TPoint.findOne({ id: pointId });
  if (!point || (point.isDeleted && !hasRight)) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }

  const { positions, total } = await PointService.getPointPositions(pointId, {
    skip,
    limit: size,
  });

  return ControllerService.treatAndConvert(
    req,
    null,
    positions,
    {
      controllerMethod: 'PointController.findPositions',
      searchedItem: `Positions of the point of id ${pointId}`,
    },
    res,
    (data) => ({ positions: data.map(toPointPosition), page, size, total })
  );
};
