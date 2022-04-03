const ElasticsearchService = require('../../../services/ElasticsearchService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.ENTRANCE,
      rightAction: RightService.RightActions.DELETE_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to delete an entrance.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete an entrance.');
  }

  // Check if entrance exists and if it's not already deleted
  const entranceId = req.param('id');
  const currentEntrance = await TEntrance.findOne(entranceId);
  if (currentEntrance) {
    if (currentEntrance.isDeleted) {
      return res.status(410).send({
        message: `The entrance with id ${entranceId} has already been deleted.`,
      });
    }
  } else {
    return res.status(404).send({
      message: `Entrance of id ${entranceId} not found.`,
    });
  }

  // Delete Entrance
  await TEntrance.destroyOne({
    id: entranceId,
  }).intercept(() =>
    res.serverError(
      `An unexpected error occured when trying to delete entrance with id ${entranceId}.`
    )
  );

  ElasticsearchService.deleteResource('entrances', entranceId);

  return res.sendStatus(204);
};
