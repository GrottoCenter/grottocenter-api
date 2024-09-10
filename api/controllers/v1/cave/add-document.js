module.exports = async (req, res) => {
  const caveId = req.param('caveId');
  const cave = await TCave.findOne({ id: caveId });
  if (!cave || cave.isDeleted) {
    return res.notFound({ message: `Cave of id ${caveId} not found.` });
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
   * TCave.addToCollection() is not used here because of the Grottocenter's historization process.
   * To avoid an uniqueness error, the dateReviewed must be set at the same time the cave id is set, which can't be accomplished with addToCollection().
   * */
  await TDocument.updateOne(documentId).set({
    dateReviewed: new Date(),
    cave: caveId,
  });

  return res.ok();
};
