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

  // The parked content was frozen at import time and carries the import's
  // creation dates: the document is only created now, so stamp it now (#1802).
  const now = new Date();
  const { document, description } = documentDuplicate.content;
  const created = await DocumentService.createDocument(
    req,
    { ...document, dateInscription: now },
    { ...description, dateInscription: now }
  );
  await TDocumentDuplicate.destroyOne(id);
  sails.log.info(
    `Document duplicate ${id} → document ${created?.id} by caver ${req.token.id}`
  );
  return res.ok();
};
