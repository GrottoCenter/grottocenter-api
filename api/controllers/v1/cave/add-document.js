const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

const { checkIfExists } = sails.helpers;
const { checkRight } = sails.helpers;

module.exports = async (req, res) => {
  // Check right
  const hasRight = await checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVE,
      rightAction: RightService.RightActions.LINK_RESOURCE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to add a document to a cave.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to add a document to a cave.');
  }

  // Check params
  const caveId = req.param('caveId');
  if (!(await checkIfExists('id', caveId, TCave))) {
    return res.status(404).send({
      message: `Cave with id ${caveId} not found.`,
    });
  }

  const documentId = req.param('documentId');
  if (!(await checkIfExists('id', documentId, TDocument))) {
    return res.status(404).send({
      message: `Document with id ${documentId} not found.`,
    });
  }

  // Update cave
  try {
    await TCave.addToCollection(caveId, 'documents', documentId);
    return res.sendStatus(204);
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
