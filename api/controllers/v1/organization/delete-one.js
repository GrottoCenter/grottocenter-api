const ElasticsearchService = require('../../../services/ElasticsearchService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete an organization.');
  }

  // Check if organization exists and if it's not already deleted
  const organizationId = req.param('id');
  const currentOrganization = await TGrotto.findOne(organizationId);
  await NameService.setNames([currentOrganization], 'grotto');
  if (currentOrganization) {
    if (currentOrganization.isDeleted) {
      return res.status(410).send({
        message: `The organization with id ${organizationId} has already been deleted.`,
      });
    }
  } else {
    return res.notFound({
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

  await NotificationService.notifySubscribers(
    req,
    currentOrganization,
    req.token.id,
    NOTIFICATION_TYPES.DELETE,
    NOTIFICATION_ENTITIES.ORGANIZATION
  );
  return res.ok();
};
