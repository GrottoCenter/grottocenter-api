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

  // Update entrance
  await TEntrance.removeFromCollection(entranceId, 'documents', documentId);

  return res.ok();
};
