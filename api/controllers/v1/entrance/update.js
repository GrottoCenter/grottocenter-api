const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const ErrorService = require('../../../services/ErrorService');
const NameService = require('../../../services/NameService');
const GeocodingService = require('../../../services/GeocodingService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toEntrance } = require('../../../services/mapping/converters');

const checkRight = sails.helpers.checkRight.with;

module.exports = async (req, res) => {
  const hasRight = await checkRight({
    groups: req.token.groups,
    rightEntity: RightService.RightEntities.ENTRANCE,
    rightAction: RightService.RightActions.EDIT_ANY,
  }).intercept('rightNotFound', () =>
    res.serverError(
      'A server error occured when checking your right to update an entrance.'
    )
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update an entrance.');
  }

  try {
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

    // Check if sensitive change is permitted
    const newIsSensitiveValue = cleanedData.isSensitive;
    if (
      newIsSensitiveValue !== undefined &&
      newIsSensitiveValue !== currentEntrance.isSensitive
    ) {
      const hasSensitiveRight = await checkRight({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: newIsSensitiveValue
          ? RightService.RightActions.MARK_AS_SENSITIVE
          : RightService.RightActions.UNMARK_AS_SENSITIVE,
      }).intercept('rightNotFound', () =>
        res.serverError(
          `A server error occured when checking your right to ${
            newIsSensitiveValue ? 'un' : ''
          }mark an entrance as sensitive.`
        )
      );
      if (!hasSensitiveRight) {
        return res.forbidden(
          `You are not authorized to ${
            newIsSensitiveValue ? 'un' : ''
          }mark an entrance as sensitive.`
        );
      }
    }

    // Update reverse geocoding if the position has changed
    if (
      Math.abs(currentEntrance.latitude - cleanedData.latitude) > 0.001 ||
      Math.abs(currentEntrance.longitude - cleanedData.longitude) > 0.001
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

    const updatedEntrance = await TEntrance.updateOne({ id: entranceId }).set(
      cleanedData
    );

    await NameService.setNames([updatedEntrance], 'entrance');

    await NotificationService.notifySubscribers(
      req,
      updatedEntrance,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.ENTRANCE
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      updatedEntrance,
      { controllerMethod: 'EntranceController.update' },
      res,
      toEntrance
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
