const ControllerService = require('../../../services/ControllerService');
const PointService = require('../../../services/PointService');
const { toPoint } = require('../../../services/mapping/converters');

// PATCH: only the fields sent are changed; the resulting point is validated.
module.exports = async (req, res) => {
  const pointId = Number(req.param('id'));

  const { notFound, error } = await PointService.updatePoint(
    pointId,
    PointService.readPointParams(req),
    req.token.id
  );
  if (notFound) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }
  if (error) return res.badRequest(error);

  const populatedPoint = await PointService.getPopulatedPoint(pointId);

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedPoint,
    {
      controllerMethod: 'PointController.update',
      searchedItem: `Point of id ${pointId}`,
    },
    res,
    toPoint
  );
};
