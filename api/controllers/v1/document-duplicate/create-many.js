const RightService = require('../../../services/RightService');

// Usused by front
// TODO Remove as no input validation is done ?
// TDocumentDuplicate are created only when importing a CSV
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

  const dateInscription = req.param('dateInscription', new Date());

  const duplicateParams = req.body.data.map((content) => ({
    dateInscription,
    content,
    document: content.document,
  }));

  await TDocumentDuplicate.createEach(duplicateParams);
  return res.ok();
};
