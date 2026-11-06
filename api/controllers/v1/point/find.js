const ControllerService = require('../../../services/ControllerService');
const PointService = require('../../../services/PointService');
const RightService = require('../../../services/RightService');
const { toPoint } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const pointId = Number(req.param('id'));

  // Public endpoint: req.token is only set for an authenticated request.
  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const point = await PointService.getPopulatedPoint(pointId);
  if (!point || (point.isDeleted && !hasRight)) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    point,
    {
      controllerMethod: 'PointController.find',
      searchedItem: `Point of id ${pointId}`,
    },
    res,
    toPoint
  );
};
