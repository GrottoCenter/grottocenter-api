const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVER,
      rightAction: RightService.RightActions.EDIT_OWN,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to unmark an entrance as explored.'
      )
    );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to unmark an entrance as explored.'
    );
  }

  // Check params
  const caverId = req.param('caverId');
  const entranceId = req.param('entranceId');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: caverId,
      sailsModel: TCaver,
    }))
  ) {
    return res.badRequest(`Could not find caver with id ${caverId}.`);
  }
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: entranceId,
      sailsModel: TEntrance,
    }))
  ) {
    return res.badRequest(`Could not find entrance with id ${entranceId}.`);
  }
  if (Number(caverId) !== req.token.id) {
    return res.forbidden(
      'You can not unmark an entrance as explored to another account than yours.'
    );
  }

  // Update caver
  try {
    await TCaver.removeFromCollection(caverId, 'exploredEntrances', entranceId);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
