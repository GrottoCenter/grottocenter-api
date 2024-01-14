const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  const entranceId = req.param('entranceId');
  const currentEntrance = await TEntrance.findOne(entranceId);
  if (!currentEntrance) {
    return res.notFound({ message: `Entrance of id ${entranceId} not found.` });
  }

  const documentId = req.param('documentId');
  const document = await TDocument.findOne({ id: documentId });
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  try {
    /**
     * TEntrance.addToCollection() is not used here because of the Grottocenter's historization process.
     * To avoid an uniqueness error, the dateReviewed must be set at the same time the entrance id is set, which can't be accomplished with addToCollection().
     * */
    await TDocument.updateOne(documentId).set({
      dateReviewed: new Date(),
      entrance: entranceId,
    });
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
