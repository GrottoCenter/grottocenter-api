const DocumentService = require('../../../services/DocumentService');
const RightService = require('../../../services/RightService');

// Create a new document from an existing duplicate document content
module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to create a document duplicate.'
    );
  }

  const id = req.param('id');
  const documentDuplicate = await TDocumentDuplicate.findOne({ id });
  if (!documentDuplicate) {
    return res.badRequest(`Could not find duplicate with id ${id}.`);
  }

  const { document, description } = documentDuplicate.content;
  await DocumentService.createDocument(req, document, description);
  await TDocumentDuplicate.destroyOne(id);
  return res.ok();
};
