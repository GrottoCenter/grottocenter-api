const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const CountryResolverService = require('../../../services/CountryResolverService');
const EnrichmentQueueService = require('../../../services/EnrichmentQueueService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toEntrance } = require('../../../services/mapping/converters');
const { validateNameLength } = require('../../../utils/nameValidation');

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

  if (!isAdmin) {
    // Non-admins cannot change the sensitivity lock
    delete cleanedData.isSensitiveLocked;

    // When sensitivity is locked, only admins may change isSensitive (either way)
    const wantsSensitiveChange =
      newIsSensitiveValue !== undefined &&
      newIsSensitiveValue !== currentEntrance.isSensitive;
    if (currentEntrance.isSensitiveLocked && wantsSensitiveChange) {
      return res.forbidden(
        `The sensitivity of this entrance is locked. Only an administrator can change it.`
      );
    }
  }

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
  let coordinatesChanged = false;
  if (
    isValidCoordinate &&
    (Math.abs(currentEntrance.latitude - cleanedData.latitude) > 0.001 ||
      Math.abs(currentEntrance.longitude - cleanedData.longitude) > 0.001)
  ) {
    cleanedData.country = CountryResolverService.resolve(
      cleanedData.latitude,
      cleanedData.longitude
    );
    // Clear stale enrichment fields — they'll be repopulated by the async job
    cleanedData.region = null;
    cleanedData.county = null;
    cleanedData.city = null;
    cleanedData.iso_3166_2 = null;
    coordinatesChanged = true;
  }

  // Validate name length
  const nameText = req.param('name')?.text;
  const nameError = validateNameLength(nameText);
  if (nameError) {
    return res.badRequest(nameError);
  }

  // Handle name manually
  // Currently, use only one name per entrance (even if the model can handle multiple names)
  // Done before the TCave update so the last_change_cave DB trigger will fetch the last updated name
  await TName.updateOne({
    entrance: entranceId,
    isMain: true,
  }).set({
    name: nameText,
    language: req.param('name')?.language,
  });

  await TEntrance.updateOne({ id: entranceId }).set(cleanedData);

  if (coordinatesChanged && cleanedData.country !== '00') {
    EnrichmentQueueService.enqueue(entranceId, 'entrance', req.traceId).catch(
      (err) => {
        sails.log.error('Failed to enqueue entrance enrichment:', err);
      }
    );
  }

  const populatedEntrance =
    await EntranceService.getPopulatedEntrance(entranceId);

  await EntranceService.updateInSearch(populatedEntrance);

  await NotificationService.notifySubscribers(
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
