const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.DOCUMENT_DUPLICATE,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create a document duplicate.'
      )
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
