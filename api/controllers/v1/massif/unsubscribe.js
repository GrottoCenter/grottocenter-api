const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to unsubscribe to a massif.');
  }

  // Check if massif exists
  const massifId = req.param('id');
  const massif = await TMassif.findOne(massifId);
  if (!massif || massif.isDeleted) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  const caver = await TCaver.findOne(req.token.id).populate(
    'subscribedToMassifs'
  );
  if (!caver.subscribedToMassifs.find((m) => m.id === massif.id)) {
    return res.badRequest(
      `You are not subscribed to the massif with id ${massifId} and therefore cannot be unsubscribed.`
    );
  }

  await TCaver.removeFromCollection(req.token.id, 'subscribedToMassifs', [
    massifId,
  ]);
  return res.ok();
};
