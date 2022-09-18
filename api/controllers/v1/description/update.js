const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.DESCRIPTION,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update any description.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update any description.');
  }

  // Check if description exists
  const descriptionId = req.param('id');
  const currentDescription = await TDescription.findOne(descriptionId);
  if (!currentDescription) {
    return res.notFound({
      message: `Description of id ${descriptionId} not found.`,
    });
  }

  const cleanedData = {
    body: req.param('body') ? req.param('body') : currentDescription.body,
    title: req.param('title') ? req.param('title') : currentDescription.title,
    language: req.param('language')
      ? req.param('language')
      : currentDescription.language,
  };

  // Launch update request
  try {
    await TDescription.updateOne({
      id: descriptionId,
    }).set(cleanedData);
    const newDescription = await TDescription.findOne(descriptionId)
      .populate('author')
      .populate('cave')
      .populate('document')
      .populate('entrance')
      .populate('exit')
      .populate('language')
      .populate('massif')
      .populate('reviewer');

    await NotificationService.notifySubscribers(
      req,
      newDescription,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.DESCRIPTION
    );

    const params = {};
    params.controllerMethod = 'DescriptionController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      newDescription,
      params,
      res,
      MappingService.convertToDescriptionModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
