const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const DescriptionService = require('../../../services/DescriptionService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const { toDescription } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
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

    const descriptionId = req.param('id');
    const rawDescription = await TDescription.findOne(descriptionId);
    // TODO How to delete/restore entity ?
    if (!rawDescription || rawDescription.isDeleted) {
      return res.notFound({
        message: `Description of id ${descriptionId} not found.`,
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

    await TDescription.updateOne({ id: descriptionId }).set(updatedFields);

    const populatedDescription = await DescriptionService.getDescription(
      descriptionId
    );
    await NotificationService.notifySubscribers(
      req,
      populatedDescription,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.DESCRIPTION
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      populatedDescription,
      { controllerMethod: 'DescriptionController.update' },
      res,
      toDescription
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
