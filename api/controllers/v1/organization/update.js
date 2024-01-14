const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const GrottoService = require('../../../services/GrottoService');
const NotificationService = require('../../../services/NotificationService');
const GeocodingService = require('../../../services/GeocodingService');
const { toOrganization } = require('../../../services/mapping/converters');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

module.exports = async (req, res) => {
  // Check if organization exists
  const organizationId = req.param('id');
  const currentOrganization = await TGrotto.findOne(organizationId);
  if (!currentOrganization) {
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
    Math.abs(currentOrganization.latitude - cleanedData.latitude) > 0.001 ||
    Math.abs(currentOrganization.longitude - cleanedData.longitude) > 0.001
  ) {
    const address = await GeocodingService.reverse(
      cleanedData.latitude,
      cleanedData.longitude
    );
    if (address) cleanedData.iso_3166_2 = address.iso_3166_2;
  }

  try {
    // The name is updated via the /api/v1/names route by the front
    await TGrotto.updateOne({
      id: organizationId,
    }).set(cleanedData);

    const updatedOrganization = await GrottoService.getPopulatedOrganization(
      organizationId
    );

    await NotificationService.notifySubscribers(
      req,
      updatedOrganization,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.ORGANIZATION
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      updatedOrganization,
      { controllerMethod: 'OrganizationController.update' },
      res,
      toOrganization
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
