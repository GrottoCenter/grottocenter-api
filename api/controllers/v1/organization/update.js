const ControllerService = require('../../../services/ControllerService');
const GrottoService = require('../../../services/GrottoService');
const NotificationService = require('../../../services/NotificationService');
const EnrichmentQueueService = require('../../../services/EnrichmentQueueService');
const { toOrganization } = require('../../../services/mapping/converters');
const { validateNameLength } = require('../../../utils/nameValidation');
const {
  validatePostalCodeLength,
} = require('../../../utils/postalCodeValidation');

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

  // Detect coordinate change for async enrichment.
  // Note: unlike entrances, organization country is user-provided (not resolved
  // from coordinates), so we only enqueue iso_3166_2 enrichment here.
  let coordinatesChanged = false;
  if (
    cleanedData.latitude &&
    cleanedData.longitude &&
    (Math.abs(rawOrganization.latitude - cleanedData.latitude) > 0.001 ||
      Math.abs(rawOrganization.longitude - cleanedData.longitude) > 0.001)
  ) {
    // Clear stale enrichment field — it'll be repopulated by the async job
    cleanedData.iso_3166_2 = null;
    coordinatesChanged = true;
  }

  // Validate postalCode length before any write (checked on the trimmed value,
  // so a value that fits once trimmed is not rejected)
  const postalCodeError = validatePostalCodeLength(cleanedData.postalCode);
  if (postalCodeError) {
    return res.badRequest(postalCodeError);
  }

  // Validate name length
  const nameText = req.body.name?.text;
  const nameError = validateNameLength(nameText);
  if (nameError) {
    return res.badRequest(nameError);
  }

  // Validate language if provided
  const nameLanguage = req.body.name?.language;
  if (nameLanguage !== undefined) {
    if (nameLanguage === null) {
      return res.badRequest('Language cannot be null.');
    }
    const foundLanguage = await TLanguage.findOne({ id: nameLanguage });
    if (!foundLanguage) {
      return res.badRequest('The provided language does not exist.');
    }
  }

  // Handle name update inline (consistent with entrance and cave update)
  if (req.body.name) {
    const nameUpdate = {};
    if (nameText !== undefined) {
      nameUpdate.name = nameText;
    }
    if (nameLanguage !== undefined) {
      nameUpdate.language = nameLanguage;
    }
    if (Object.keys(nameUpdate).length > 0) {
      const updatedName = await TName.updateOne({
        grotto: organizationId,
        isMain: true,
      }).set(nameUpdate);
      if (!updatedName) {
        sails.log.warn(
          `Organization ${organizationId} has no main name record to update.`
        );
      }
    }
  }

  await TGrotto.updateOne({ id: organizationId }).set(cleanedData);

  if (coordinatesChanged) {
    EnrichmentQueueService.enqueue(
      organizationId,
      'organization',
      req.traceId
    ).catch((err) => {
      sails.log.error('Failed to enqueue organization enrichment:', err);
    });
  }

  const updatedOrganization =
    await GrottoService.getPopulatedOrganization(organizationId);

  await GrottoService.updateInSearch(updatedOrganization);
  await NotificationService.notifySubscribers(
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
