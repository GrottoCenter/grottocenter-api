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

  const massifId = req.param('massifId');
  const massif = await TMassif.findOne(massifId);
  if (!massif || massif.isDeleted) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  const documentId = req.param('documentId');
  const document = await TDocument.findOne({ id: documentId });
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  // Update entrance
  await TMassif.removeFromCollection(massifId, 'documents', documentId);

  return res.ok();
};
