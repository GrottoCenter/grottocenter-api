const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const GeocodingService = require('../../../services/GeocodingService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toEntrance } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const entranceId = req.param('id');
  const currentEntrance = await TEntrance.findOne(entranceId);
  if (!currentEntrance || currentEntrance.isDeleted) {
    return res.notFound({
      message: `Entrance of id ${entranceId} not found.`,
    });
  }

  const cleanedData = {
    reviewer: req.token.id,
    // dateReviewed will be updated automatically by the SQL historisation trigger
    ...EntranceService.getConvertedDataFromClientRequest(req),
  };

  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  // Check if sensitive change is permitted
  const newIsSensitiveValue = cleanedData.isSensitive;
  if (
    !isAdmin &&
    newIsSensitiveValue === false &&
    newIsSensitiveValue !== currentEntrance.isSensitive
  ) {
    // Only administrator can remove the sensitive property of an entrance
    return res.forbidden(
      `You are not authorized to unmark an entrance as sensitive.`
    );
  }

  if (!isAdmin && newIsSensitiveValue) {
    delete cleanedData.latitude;
    delete cleanedData.longitude;
  }

  const isValidCoordinate = cleanedData.latitude && cleanedData.longitude;
  // Update reverse geocoding if the position has changed
  if (
    isValidCoordinate &&
    (Math.abs(currentEntrance.latitude - cleanedData.latitude) > 0.001 ||
      Math.abs(currentEntrance.longitude - cleanedData.longitude) > 0.001)
  ) {
    const address = await GeocodingService.reverse(
      cleanedData.latitude,
      cleanedData.longitude
    );
    if (address) {
      cleanedData.region = address.region;
      cleanedData.county = address.county;
      cleanedData.city = address.city;
      cleanedData.country = address.id_country;
      cleanedData.iso_3166_2 = address.iso_3166_2;
    }
  }

  // Handle name manually
  // Currently, use only one name per entrance (even if the model can handle multiple names)
  // Done before the TCave update so the last_change_cave DB trigger will fetch the last updated name
  await TName.updateOne({ entrance: entranceId }).set({
    name: req.param('name')?.text,
    language: req.param('name')?.language,
  });

  await TEntrance.updateOne({ id: entranceId }).set(cleanedData);

  const populatedEntrance =
    await EntranceService.getPopulatedEntrance(entranceId);

  await NotificationService.notifySubscribers(
    req,
    populatedEntrance,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.ENTRANCE
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedEntrance,
    { controllerMethod: 'EntranceController.update' },
    res,
    toEntrance
  );
};
