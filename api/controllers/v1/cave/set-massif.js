const RightService = require('../../../services/RightService');

const { checkIfExists } = sails.helpers;
const { checkRight } = sails.helpers;

module.exports = async (req, res) => {
  // Check right
  const hasRight = await checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVE,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to add a cave to a massif.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to add a cave to a massif.');
  }

  // Check params
  const caveId = req.param('caveId');
  if (!(await checkIfExists('id', caveId, TCave))) {
    return res.notFound({ message: `Cave with id ${caveId} not found.` });
  }

  const massifId = req.param('massifId');
  if (!(await checkIfExists('id', massifId, TMassif))) {
    return res.notFound({ message: `Massif with id ${massifId} not found.` });
  }

  // Update cave
  await TCave.updateOne({
    id: caveId,
  }).set({
    massif: massifId,
  });
  return res.ok();
};
