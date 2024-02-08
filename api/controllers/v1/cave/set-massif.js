const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');

const { checkIfExists } = sails.helpers;

module.exports = async (req, res) => {
  // Check params
  const caveId = req.param('caveId');
  if (!(await checkIfExists('id', caveId, TCave))) {
    return res.notFound({ message: `Cave with id ${caveId} not found.` });
  }

  const massifId = req.param('massifId');
  if (!(await checkIfExists('id', massifId, TMassif))) {
    return res.notFound({ message: `Massif with id ${massifId} not found.` });
  }

  // Update cave
  const cave = await TCave.updateOne({
    id: caveId,
  }).set({
    massif: massifId,
  });

  await NotificationService.notifySubscribers(
    req,
    cave,
    req.token.id,
    NOTIFICATION_TYPES.UPDATE,
    NOTIFICATION_ENTITIES.CAVE
  );
  return res.ok();
};
