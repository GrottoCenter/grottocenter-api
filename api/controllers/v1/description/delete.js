const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const DescriptionService = require('../../../services/DescriptionService');
const { toSimpleDescription } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');
const RecentChangeService = require('../../../services/RecentChangeService');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to delete description.');

  // Read before any write: an invalid value must not leave a half-done delete.
  const { value: deletePermanently, error: isPermanentError } = readBoolParam(
    req,
    'isPermanent',
    false
  );
  if (isPermanentError) return res.badRequest(isPermanentError);

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

    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'description',
      descriptionId,
      req.token.id
    );
  }

  if (deletePermanently) {
    await HDescription.destroy({ t_id: descriptionId });
    await TNotification.destroy({ description: descriptionId });
    await TDescription.destroyOne({ id: descriptionId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
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
