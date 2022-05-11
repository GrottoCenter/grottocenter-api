const ElasticsearchService = require('../../../services/ElasticsearchService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.ORGANIZATION,
      rightAction: RightService.RightActions.DELETE_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to delete an organization.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete an organization.');
  }

  // Check if organization exists and if it's not already deleted
  const organizationId = req.param('id');
  const currentOrganization = await TGrotto.findOne(organizationId);
  if (currentOrganization) {
    if (currentOrganization.isDeleted) {
      return res.status(410).send({
        message: `The organization with id ${organizationId} has already been deleted.`,
      });
    }
  } else {
    return res.status(404).send({
      message: `Organization of id ${organizationId} not found.`,
    });
  }

  // Delete Organization
  await TGrotto.destroyOne({
    id: organizationId,
  }).intercept(() =>
    res.serverError(
      `An unexpected error occured when trying to delete organization with id ${organizationId}.`
    )
  );

  await ElasticsearchService.deleteResource('grottos', organizationId);
  return res.sendStatus(204);
};
