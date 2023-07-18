const ErrorService = require('../../../services/ErrorService');

const { checkIfExists } = sails.helpers;

module.exports = async (req, res) => {
  // Check params
  const caveId = req.param('caveId');
  if (!(await checkIfExists('id', caveId, TCave))) {
    return res.notFound({
      message: `Cave with id ${caveId} not found.`,
    });
  }

  const documentId = req.param('documentId');
  if (!(await checkIfExists('id', documentId, TDocument))) {
    return res.notFound({
      message: `Document with id ${documentId} not found.`,
    });
  }

  // Update cave
  try {
    /**
     * TCave.addToCollection() is not used here because of the Grottocenter's historization process.
     * To avoid an uniqueness error, the dateReviewed must be set at the same time the cave id is set, which can't be accomplished with addToCollection().
     * */
    await TDocument.updateOne(documentId).set({
      dateReviewed: new Date(),
      cave: caveId,
    });
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
