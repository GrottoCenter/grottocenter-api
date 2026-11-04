const PointService = require('../../../services/PointService');
const { toPointPosition } = require('../../../services/mapping/converters');

// Create or replace the position of the point on one document. Idempotent:
// the same request always leaves the same single position.
module.exports = async (req, res) => {
  const pointId = Number(req.param('id'));
  const documentId = Number(req.param('documentId'));

  const point = await TPoint.findOne({ id: pointId });
  if (!point || point.isDeleted) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }

  const { error, status, data } = await PointService.validatePositionInput(
    documentId,
    { x: req.param('x'), y: req.param('y') }
  );
  if (error) {
    return status === 'notFound'
      ? res.notFound({ message: error })
      : res.badRequest(error);
  }

  const { position } = await PointService.upsertPosition(
    pointId,
    documentId,
    data
  );
  return res.ok(toPointPosition(position));
};
