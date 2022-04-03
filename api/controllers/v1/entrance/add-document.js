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
    return res.status(404).send({
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
    return res
      .status(404)
      .send({ message: `Document of id ${documentId} not found.` });
  }

  // Update entrance
  TEntrance.addToCollection(entranceId, 'documents', documentId)
    .then(() => res.sendStatus(204))
    .catch({ name: 'UsageError' }, (err) => res.badRequest(err.cause.message))
    .catch({ name: 'AdapterError' }, (err) => res.badRequest(err.cause.message))
    .catch((err) => res.serverError(err.cause.message));
  return res.status(204);
};