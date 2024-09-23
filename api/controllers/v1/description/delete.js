const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const DescriptionService = require('../../../services/DescriptionService');
const { toSimpleDescription } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to delete description.');

  const descriptionId = req.param('id');
  const description = await DescriptionService.getDescription(descriptionId);
  if (!description) {
    return res.notFound({
      message: `Description of id ${descriptionId} not found.`,
    });
  }

  if (!description.isDeleted) {
    await TDescription.destroyOne({ id: descriptionId }); // Soft delete
    description.isDeleted = true;
  }

  const deletePermanently = !!req.param('isPermanent');
  if (deletePermanently) {
    await HDescription.destroy({ t_id: descriptionId });
    await TNotification.destroy({ description: descriptionId });
    await TDescription.destroyOne({ id: descriptionId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    req,
    description,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.DESCRIPTION
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    description,
    { controllerMethod: 'DescriptionController.delete' },
    res,
    toSimpleDescription
  );
};
