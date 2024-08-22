const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const LocationService = require('../../../services/LocationService');
const { toSimpleLocation } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const locationId = req.param('id');
  const rawLocation = await TLocation.findOne(locationId);
  if (!rawLocation || rawLocation.isDeleted) {
    return res.notFound({ message: `Location of id ${locationId} not found.` });
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
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.LOCATION
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedLocation,
    { controllerMethod: 'LocationController.update' },
    res,
    toSimpleLocation
  );
};
