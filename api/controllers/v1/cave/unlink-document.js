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

  const caveId = req.param('caveId');
  const cave = await TCave.findOne(caveId);
  if (!cave || cave.isDeleted) {
    return res.notFound({ message: `Cave of id ${caveId} not found.` });
  }

  const documentId = req.param('documentId');
  const document = await TDocument.findOne({ id: documentId });
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  await TCave.removeFromCollection(caveId, 'documents', documentId);

  return res.ok();
};
