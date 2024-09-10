module.exports = async (req, res) => {
  const massifId = req.param('massifId');
  const massif = await TMassif.findOne({ id: massifId });
  if (!massif || massif.isDeleted) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  const documentId = req.param('documentId');
  const document = await TDocument.findOne({
    id: documentId,
    isDeleted: false,
  }).populate('massifs');
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  const docMassifs = document.massifs.map((e) => e.id);
  if (!docMassifs.includes(massif)) docMassifs.push(massifId);

  /**
   * TMassif.addToCollection() is not used here because of the Grottocenter's historization process.
   * To avoid an uniqueness error, the dateReviewed must be set at the same time the massif id is set, which can't be accomplished with addToCollection().
   * */
  await TDocument.updateOne(documentId).set({
    dateReviewed: new Date(),
    massifs: docMassifs,
  });
  return res.ok();
};
