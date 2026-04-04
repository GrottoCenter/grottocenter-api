const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to ban a caver.');
  }

  const { caverId } = req.params;

  if (req.token.id === parseInt(caverId, 10)) {
    return res.forbidden('You cannot ban yourself.');
  }

  const caver = await TCaver.findOne({ id: caverId });
  if (!caver) {
    return res.notFound(`Caver with id ${caverId} not found.`);
  }

  if (!caver.banned) {
    await TCaver.updateOne({ id: caverId }).set({ banned: true });
  }

  await BlacklistService.revoke(parseInt(caverId, 10));

  return res.ok({ banned: true });
};
