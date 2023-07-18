const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const NotificationService = require('../../../services/NotificationService');
const DescriptionService = require('../../../services/DescriptionService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const { toSimpleDescription } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
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
      toSimpleDescription
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
