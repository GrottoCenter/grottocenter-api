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

  /**
   * TEntrance.addToCollection() is not used here because of the Grottocenter's historization process.
   * To avoid an uniqueness error, the dateReviewed must be set at the same time the entrance id is set, which can't be accomplished with addToCollection().
   * */
  await TDocument.updateOne(documentId).set({
    dateReviewed: new Date(),
    entrance: entranceId,
  });
  return res.ok();
};
