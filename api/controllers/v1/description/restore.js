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
    return res.forbidden('You are not authorized to restore description.');

  const descriptionId = req.param('id');
  const description = await DescriptionService.getDescription(descriptionId);
  if (!description || !description.isDeleted) {
    return res.notFound({
      message: `Description of id ${descriptionId} not found or not deleted.`,
    });
  }

  await TDescription.updateOne({ id: descriptionId }).set({ isDeleted: false });
  description.isDeleted = false;

  await NotificationService.notifySubscribers(
    req,
    description,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.DESCRIPTION
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    description,
    { controllerMethod: 'DescriptionController.restore' },
    res,
    toSimpleDescription
  );
};
