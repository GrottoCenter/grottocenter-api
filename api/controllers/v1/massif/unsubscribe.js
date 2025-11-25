const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  const isLeader = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );

  if (!isAdmin && !isLeader) {
    return res.forbidden(
      'You are not authorized to unsubscribe from a massif.'
    );
  }

  const targetUserId = req.param('userId') || req.token.id;

  if (!isAdmin && targetUserId !== req.token.id) {
    return res.forbidden('You can only unsubscribe yourself.');
  }

  // Check if massif exists
  const massifId = req.param('id');
  const massif = await TMassif.findOne(massifId);
  if (!massif || massif.isDeleted) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  const caver = await TCaver.findOne(targetUserId).populate(
    'subscribedToMassifs'
  );

  if (!isAdmin && !caver.subscribedToMassifs.find((m) => m.id === massif.id)) {
    return res.badRequest(
      `You are not subscribed to the massif with id ${massifId} and therefore cannot be unsubscribed.`
    );
  }

  await TCaver.removeFromCollection(targetUserId, 'subscribedToMassifs', [
    massifId,
  ]);
  return res.ok();
};
