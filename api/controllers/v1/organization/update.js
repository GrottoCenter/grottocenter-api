const ControllerService = require('../../../services/ControllerService');
const GrottoService = require('../../../services/GrottoService');
const NotificationService = require('../../../services/NotificationService');
const GeocodingService = require('../../../services/GeocodingService');
const { toOrganization } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  // Check if organization exists
  const organizationId = req.param('id');
  const rawOrganization = await TGrotto.findOne(organizationId);
  if (!rawOrganization || rawOrganization.isDeleted) {
    return res.notFound({
      message: `Organization of id ${organizationId} not found.`,
    });
  }

  const cleanedData = {
    ...GrottoService.getConvertedDataFromClientRequest(req),
    reviewer: req.token.id,
    id: organizationId,
  };

  // Update reverse geocoding if the position has changed
  if (
    Math.abs(rawOrganization.latitude - cleanedData.latitude) > 0.001 ||
    Math.abs(rawOrganization.longitude - cleanedData.longitude) > 0.001
  ) {
    const address = await GeocodingService.reverse(
      cleanedData.latitude,
      cleanedData.longitude
    );
    if (address) cleanedData.iso_3166_2 = address.iso_3166_2;
  }

  // The name is updated via the /api/v1/names route by the front
  await TGrotto.updateOne({ id: organizationId }).set(cleanedData);

  const updatedOrganization =
    await GrottoService.getPopulatedOrganization(organizationId);

  await NotificationService.notifySubscribers(
    req,
    updatedOrganization,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.ORGANIZATION
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    updatedOrganization,
    { controllerMethod: 'OrganizationController.update' },
    res,
    toOrganization
  );
};
