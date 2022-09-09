const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

const { checkIfExists } = sails.helpers;
const { checkRight } = sails.helpers;

module.exports = async (req, res) => {
  // Check right
  const hasRight = await checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.MASSIF,
      rightAction: RightService.RightActions.SUBSCRIBE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to subscribe to a massif.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to subscribe to a massif.');
  }

  // Check if massif exists
  const massifId = req.param('id');
  if (
    !(await checkIfExists.with({
      attributeName: 'id',
      attributeValue: massifId,
      sailsModel: TMassif,
    }))
  ) {
    return res.notFound({
      error: `Could not find massif with id ${massifId}.`,
    });
  }

  try {
    await TCaver.addToCollection(req.token.id, 'subscribedToMassifs', [
      massifId,
    ]);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
