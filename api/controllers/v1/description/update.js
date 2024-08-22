const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const DescriptionService = require('../../../services/DescriptionService');
const { toSimpleDescription } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const descriptionId = req.param('id');
  const rawDescription = await TDescription.findOne(descriptionId);
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

  const populatedDescription =
    await DescriptionService.getDescription(descriptionId);
  await NotificationService.notifySubscribers(
    req,
    populatedDescription,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.DESCRIPTION
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedDescription,
    { controllerMethod: 'DescriptionController.update' },
    res,
    toSimpleDescription
  );
};
