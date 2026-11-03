const ControllerService = require('../../../services/ControllerService');
const PointService = require('../../../services/PointService');
const RightService = require('../../../services/RightService');
const { toPoint } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const hasRight =
    RightService.hasGroup(req.token.groups, RightService.G.MODERATOR) ||
    RightService.hasGroup(req.token.groups, RightService.G.ADMINISTRATOR);
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a point.');
  }

  const pointId = Number(req.param('id'));
  const point = await TPoint.findOne({ id: pointId });
  if (!point) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }

  // t_point has no histo_delete trigger: a destroy would remove the row, so
  // the soft delete is an update. Observations and documents keep their link.
  if (!point.isDeleted) {
    await TPoint.updateOne({ id: pointId }).set({
      isDeleted: true,
      reviewer: req.token.id,
      dateReviewed: new Date(),
    });
  }

  const deletedPoint = await PointService.getPopulatedPoint(pointId);

  return ControllerService.treatAndConvert(
    req,
    null,
    deletedPoint,
    {
      controllerMethod: 'PointController.delete',
      searchedItem: `Point of id ${pointId}`,
    },
    res,
    toPoint
  );
};
