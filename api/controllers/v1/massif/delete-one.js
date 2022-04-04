const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.MASSIF,
      rightAction: RightService.RightActions.DELETE_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to delete a massif.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a massif.');
  }

  // Check if massif exists and if it's not already deleted
  const massifId = req.param('id');
  const currentMassif = await TMassif.findOne(massifId);
  if (currentMassif) {
    if (currentMassif.isDeleted) {
      return res.status(410).send({
        message: `The massif with id ${massifId} has already been deleted.`,
      });
    }
  } else {
    return res.status(404).send({
      message: `Massif of id ${massifId} not found.`,
    });
  }
  // Delete massif
  await TMassif.destroyOne({ id: massifId }).intercept(() =>
    res.serverError(
      `An unexpected error occured when trying to delete massif with id ${massifId}.`
    )
  );
  return res.sendStatus(204);
};
