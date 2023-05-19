const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const NameService = require('../../../services/NameService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toCave } = require('../../../services/mapping/converters');

const { checkRight } = sails.helpers;

module.exports = async (req, res) => {
  const hasRight = await checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVE,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update a cave.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update a cave.');
  }

  try {
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

    if (newLatitude) updatedFields.latitude = newLatitude;
    if (newLongitude) updatedFields.longitude = newLongitude;
    if (newDepth) updatedFields.depth = newDepth;
    if (newLength) updatedFields.caveLength = newLength;
    if (newTemperature) updatedFields.temperature = newTemperature;
    if (newIsDiving) updatedFields.isDiving = newIsDiving;

    // Handle name manually
    // Currently, use only one name per cave (even if the model can handle multiple names)
    // Done before the TCave update so the last_change_cave DB trigger will fetch the last updated name
    await TName.updateOne({
      cave: caveId,
    }).set({
      name: req.param('name')?.text,
      language: req.param('name')?.language,
    });

    await TCave.updateOne({ id: caveId }).set(updatedFields);

    const populatedCave = await TCave.findOne(caveId)
      .populate('author')
      .populate('reviewer');
    await NameService.setNames([populatedCave], 'cave');

    await NotificationService.notifySubscribers(
      req,
      populatedCave,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.CAVE
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedCave,
      { controllerMethod: 'CaveController.update' },
      res,
      toCave
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
