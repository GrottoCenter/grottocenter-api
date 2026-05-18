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
    return res.ok();
  }

  try {
    await TEntrance.addToCollection(entranceId, 'documents', documentId);
  } catch (err) {
    if (err.code === 'E_UNIQUE') {
      sails.log.debug(
        `Race-condition duplicate: entrance ${entranceId} / document ${documentId} link already exists.`
      );
      return res.ok();
    }
    throw err;
  }

  await TDocument.updateOne(documentId).set({
    dateReviewed: new Date(),
  });
  return res.ok();
};
