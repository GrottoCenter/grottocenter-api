const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to unban a caver.');
  }

  const { caverId } = req.params;

  const caver = await TCaver.findOne({ id: caverId });
  if (!caver) {
    return res.notFound(`Caver with id ${caverId} not found.`);
  }

  if (!caver.banned) {
    return res.ok({ banned: false });
  }

  await TCaver.updateOne({ id: caverId }).set({ banned: false });

  return res.ok({ banned: false });
};
