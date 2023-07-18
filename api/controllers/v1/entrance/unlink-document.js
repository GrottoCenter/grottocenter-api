const DocumentService = require('../../../services/DocumentService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to remove a document from an entrance.'
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
  if (!(await DocumentService.checkIfExists('id', documentId))) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  // Update entrance
  TEntrance.removeFromCollection(entranceId, 'documents', documentId)
    .then(() => res.ok())
    .catch({ name: 'UsageError' }, (err) => res.badRequest(err.cause.message))
    .catch({ name: 'AdapterError' }, (err) => res.badRequest(err.cause.message))
    .catch((err) => res.serverError(err.cause.message));
  return res.ok();
};
