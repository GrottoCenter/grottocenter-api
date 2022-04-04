const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.ENTRANCE_DUPLICATE,
      rightAction: RightService.RightActions.DELETE_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to delete an entrance duplicate.'
      )
    );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to delete an entrance duplicate.'
    );
  }
  const id = req.param('id');
  if (!id) {
    return res.badRequest('You must provide the id of the duplicate.');
  }

  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: req.param('id'),
      sailsModel: TEntranceDuplicate,
    }))
  ) {
    return res.badRequest(
      `Could not find duplicate with id ${req.param('id')}.`
    );
  }

  await TEntranceDuplicate.destroyOne(id);
  return res.ok();
};
