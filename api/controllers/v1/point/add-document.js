module.exports = async (req, res) => {
  const pointId = Number(req.param('pointId'));
  const point = await TPoint.findOne({ id: pointId });
  if (!point || point.isDeleted) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }

  const documentId = Number(req.param('documentId'));
  const document = await TDocument.findOne({
    id: documentId,
    isDeleted: false,
  });
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  if (document.point === pointId) return res.ok();

  // A document references at most one point: moving it to another point
  // must go through an explicit unlink first.
  if (document.point !== null && document.point !== undefined) {
    return res.conflict(
      `Document of id ${documentId} already references the point of id ${document.point}.`
    );
  }

  await TDocument.updateOne({ id: documentId }).set({
    point: pointId,
    dateReviewed: new Date(),
  });
  return res.ok();
};
