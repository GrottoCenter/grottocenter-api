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
  const document = await TDocument.findOne({ id: documentId });
  if (!document || document.point !== pointId) {
    return res.notFound({
      message: `Document of id ${documentId} does not reference the point of id ${pointId}.`,
    });
  }

  await TDocument.updateOne({ id: documentId }).set({ point: null });
  return res.ok();
};
