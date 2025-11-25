module.exports = async (req, res) => {
  const entranceId = req.param('entranceId');
  const entrance = await TEntrance.findOne(entranceId);
  if (!entrance || entrance.isDeleted) {
    return res.notFound({ message: `Entrance of id ${entranceId} not found.` });
  }

  const documentId = req.param('documentId');
  const document = await TDocument.findOne({
    id: documentId,
    isDeleted: false,
  });
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  const existingLink = await JDocumentEntrance.count({
    document: documentId,
    entrance: entranceId,
  });
  if (existingLink > 0) {
    return res.badRequest({
      message: `Document ${documentId} is already linked to entrance ${entranceId}.`,
    });
  }

  await TEntrance.addToCollection(entranceId, 'documents', documentId);
  await TDocument.updateOne(documentId).set({
    dateReviewed: new Date(),
  });
  return res.ok();
};
