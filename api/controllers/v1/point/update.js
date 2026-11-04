const ControllerService = require('../../../services/ControllerService');
const PointService = require('../../../services/PointService');
const { toPoint } = require('../../../services/mapping/converters');

// PATCH: only the fields sent are changed; the resulting point is validated.
module.exports = async (req, res) => {
  const pointId = Number(req.param('id'));

  const point = await TPoint.findOne({ id: pointId });
  if (!point || point.isDeleted) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }

  const { error, data } = await PointService.validatePointInput(
    PointService.readPointParams(req),
    point
  );
  if (error) return res.badRequest(error);

  await TPoint.updateOne({ id: pointId }).set({
    ...data,
    reviewer: req.token.id,
    dateReviewed: new Date(),
  });

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
