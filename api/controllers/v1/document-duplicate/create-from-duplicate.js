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

  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: req.param('id'),
      sailsModel: TDocumentDuplicate,
    }))
  ) {
    return res.badRequest(
      `Could not find duplicate with id ${req.param('id')}.`
    );
  }
  const id = req.param('id');
  const duplicate = await TDocumentDuplicate.findOne(id);
  const { document, description } = duplicate.content;
  await DocumentService.createDocument(req, document, description);
  await TDocumentDuplicate.destroyOne(id);
  return res.ok();
};
