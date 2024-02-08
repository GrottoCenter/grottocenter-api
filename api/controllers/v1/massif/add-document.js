const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  const massifId = req.param('massifId');
  const currentMassif = await TMassif.findOne({ id: massifId });
  if (!currentMassif) {
    return res.notFound({ message: `Entrance of id ${massifId} not found.` });
  }

  const documentId = req.param('documentId');
  const document = await TDocument.findOne({ id: documentId }).populate(
    'massifs'
  );
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  const docMassifs = document.massifs.map((e) => e.id);
  if (!docMassifs.includes(currentMassif)) docMassifs.push(massifId);

  try {
    /**
     * TMassif.addToCollection() is not used here because of the Grottocenter's historization process.
     * To avoid an uniqueness error, the dateReviewed must be set at the same time the massif id is set, which can't be accomplished with addToCollection().
     * */
    await TDocument.updateOne(documentId).set({
      dateReviewed: new Date(),
      massifs: massifId,
    });
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
