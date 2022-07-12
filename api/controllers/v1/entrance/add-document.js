const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.ENTRANCE,
      rightAction: RightService.RightActions.LINK_RESOURCE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to add a document to an entrance.'
      )
    );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to add a document to an entrance.'
    );
  }

  // Check params
  const entranceId = req.param('entranceId');
  const currentEntrance = await TEntrance.findOne(entranceId);
  if (!currentEntrance) {
    return res.notFound({
      message: `Entrance of id ${entranceId} not found.`,
    });
  }

  const documentId = req.param('documentId');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: documentId,
      sailsModel: TDocument,
    }))
  ) {
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
    })
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
