const ControllerService = require('../../../services/ControllerService');
const coerceToInt = require('../../../utils/coerceToInt');
const CaveService = require('../../../services/CaveService');
const NotificationService = require('../../../services/NotificationService');
const { toCave } = require('../../../services/mapping/converters');
const { validateNameLength } = require('../../../utils/nameValidation');

module.exports = async (req, res) => {
  const caveId = req.param('id');
  const rawCave = await TCave.findOne(caveId);
  if (!rawCave || rawCave.isDeleted) {
    return res.notFound({
      message: `Cave with id ${caveId} not found.`,
    });
  }

  const newLatitude = req.param('latitude');
  const newLongitude = req.param('longitude');
  const newDepth = req.param('depth');
  const newLength = req.param('length');
  const newTemperature = req.param('temperature');
  const newIsDiving = req.param('isDiving');

  const updatedFields = {
    reviewer: req.token.id,
    // dateReviewed will be updated automaticly by the SQL historisation trigger
  };

  if (newLatitude != null) updatedFields.latitude = newLatitude;
  if (newLongitude != null) updatedFields.longitude = newLongitude;
  if (newDepth != null) updatedFields.depth = coerceToInt(newDepth);
  if (newLength != null) updatedFields.caveLength = coerceToInt(newLength);
  if (newTemperature != null) updatedFields.temperature = newTemperature;
  if (newIsDiving != null) updatedFields.isDiving = newIsDiving;

  // Validate name length
  const nameText = req.body.name?.text;
  const nameError = validateNameLength(nameText);
  if (nameError) {
    return res.badRequest(nameError);
  }

  // Handle name manually
  // Currently, use only one name per cave (even if the model can handle multiple names)
  // Done before the TCave update so the last_change_cave DB trigger will fetch the last updated name
  await TName.updateOne({
    cave: caveId,
    isMain: true,
  }).set({
    name: nameText,
    language: req.body.name?.language,
  });

  await TCave.updateOne({ id: caveId }).set(updatedFields);

  const populatedCave = await CaveService.getPopulatedCave(caveId);

  await CaveService.updateInSearch(populatedCave);
  await NotificationService.notifySubscribers(
    req,
    populatedCave,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.CAVE
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedCave,
    { controllerMethod: 'CaveController.update' },
    res,
    toCave
  );
};
