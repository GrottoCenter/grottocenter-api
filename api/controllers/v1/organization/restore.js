const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const GrottoService = require('../../../services/GrottoService');
const { toOrganization } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to restore an organization.');

  const organizationId = req.param('id');
  const organization =
    await GrottoService.getPopulatedOrganization(organizationId);
  if (!organization || !organization.isDeleted) {
    return res.notFound({
      message: `Organization of id ${organizationId} not found or not deleted.`,
    });
  }

  await TGrotto.updateOne({ id: organizationId }).set({
    isDeleted: false,
    redirectTo: null,
  });
  organization.isDeleted = false;
  organization.redirectTo = null;

  await GrottoService.createESOrganization(organization).catch(() => {});

  await NotificationService.notifySubscribers(
    req,
    organization,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.ORGANIZATION
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    organization,
    { controllerMethod: 'OrganizationController.restore' },
    res,
    toOrganization
  );
};
