module.exports = async (req, res) => {
  const pointId = Number(req.param('pointId'));
  const point = await TPoint.findOne({ id: pointId });
  if (!point || point.isDeleted) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }

  const documentId = Number(req.param('documentId'));

  // A document references at most one point: moving it to another point
  // must go through an explicit unlink first. The condition on the current
  // point is part of the write, so two concurrent attachments of the same
  // document cannot both succeed.
  const updated = await TDocument.update({
    id: documentId,
    isDeleted: false,
    point: null,
  })
    .set({ point: pointId, dateReviewed: new Date() })
    .fetch();
  if (updated.length > 0) return res.ok();

  // Nothing written: the document is missing, deleted, or already references
  // a point, possibly through a concurrent request.
  const document = await TDocument.findOne({
    id: documentId,
    isDeleted: false,
  });
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }
  if (document.point === pointId) return res.ok();
  return res.conflict(
    `Document of id ${documentId} already references the point of id ${document.point}.`
  );
};
