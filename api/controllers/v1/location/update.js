const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/mapping/MappingService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
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

  // Check if location exists
  const locationId = req.param('id');
  if (
    !(await sails.helpers.checkIfExists.with({
      attributeName: 'id',
      attributeValue: locationId,
      sailsModel: TLocation,
    }))
  ) {
    return res.notFound({
      message: `Location of id ${locationId} not found.`,
    });
  }

  const newBody = req.param('body');
  const newTitle = req.param('title');
  const newLanguage = req.param('language');
  const cleanedData = {
    ...(newBody && { body: newBody }),
    ...(newTitle && { title: newTitle }),
    ...(newLanguage && { language: newLanguage }),
  };

  try {
    await TLocation.updateOne({
      id: locationId,
    }).set(cleanedData);
    const populatedLocation = await TLocation.findOne(locationId)
      .populate('author')
      .populate('entrance')
      .populate('language')
      .populate('reviewer');

    await NotificationService.notifySubscribers(
      req,
      populatedLocation,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.LOCATION
    );

    const params = {};
    params.controllerMethod = 'LocationController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      populatedLocation,
      params,
      res,
      MappingService.convertToLocationModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
