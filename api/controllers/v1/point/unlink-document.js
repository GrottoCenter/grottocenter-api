const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to remove a document from a point.'
    );
  }

  const pointId = Number(req.param('pointId'));
  const point = await TPoint.findOne({ id: pointId });
  if (!point) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }

  const documentId = Number(req.param('documentId'));
  // The expected point is part of the write: a stale request cannot clear an
  // association made to another point in the meantime.
  const updated = await TDocument.update({ id: documentId, point: pointId })
    .set({ point: null })
    .fetch();
  if (updated.length === 0) {
    return res.notFound({
      message: `Document of id ${documentId} does not reference the point of id ${pointId}.`,
    });
  }
  return res.ok();
};
