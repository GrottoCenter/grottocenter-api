// Remove the position of the point on one document; its positions on other
// documents are kept.
module.exports = async (req, res) => {
  const pointId = Number(req.param('id'));
  const documentId = Number(req.param('documentId'));

  const point = await TPoint.findOne({ id: pointId });
  if (!point || point.isDeleted) {
    return res.notFound({ message: `Point of id ${pointId} not found.` });
  }

  const destroyed = await JPointDocumentPosition.destroy({
    point: pointId,
    document: documentId,
  }).fetch();
  if (destroyed.length === 0) {
    return res.notFound({
      message: `The point of id ${pointId} has no position on the document of id ${documentId}.`,
    });
  }
  return res.ok();
};
