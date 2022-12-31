const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const LocationService = require('../../../services/LocationService');
const { toSimpleLocation } = require('../../../services/mapping/converters');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

module.exports = async (req, res) => {
  try {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.LOCATION,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', () =>
        res.serverError(
          'A server error occured when checking your right to update any location.'
        )
      );
    if (!hasRight) {
      return res.forbidden('You are not authorized to update any location.');
    }

    const locationId = req.param('id');
    const rawLocation = await TLocation.findOne(locationId);
    // TODO How to delete/restore entity ?
    if (!rawLocation || rawLocation.isDeleted) {
      return res.notFound({
        message: `Location of id ${locationId} not found.`,
      });
    }

    const newTitle = req.param('title');
    const newBody = req.param('body');
    const newLanguage = req.param('language');
    const updatedFields = {
      reviewer: req.token.id,
      // dateReviewed will be updated automaticly by the SQL historisation trigger
    };

    if (newTitle) updatedFields.title = newTitle;
    if (newBody) updatedFields.body = newBody;
    if (newLanguage) updatedFields.language = newLanguage;
    // TODO re-compute relevance ?

    await TLocation.updateOne({ id: locationId }).set(updatedFields);

    const populatedLocation = await LocationService.getLocation(locationId);
    await NotificationService.notifySubscribers(
      req,
      populatedLocation,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.LOCATION
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedLocation,
      { controllerMethod: 'LocationController.update' },
      res,
      toSimpleLocation
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
