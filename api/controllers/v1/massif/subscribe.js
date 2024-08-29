const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to subscribe to a massif.');
  }

  // Check if massif exists
  const massifId = req.param('id');
  const massif = await TMassif.findOne(massifId);
  if (!massif || massif.isDeleted) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  await TCaver.addToCollection(req.token.id, 'subscribedToMassifs', [massifId]);
  return res.ok();
};
