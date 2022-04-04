const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.ENTRANCE_DUPLICATE,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create an entrance duplicate.'
      )
    );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to create an entrance duplicate.'
    );
  }

  const dateInscription = req.param('dateInscription', new Date());
  const duplicateParams = req.body.data.map((content) => ({
    dateInscription,
    content,
    document: content.document,
  }));

  await TEntranceDuplicate.createEach(duplicateParams);
  return res.ok();
};
