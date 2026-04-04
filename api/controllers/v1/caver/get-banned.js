const { toListCaver } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to list banned cavers.');
  }

  const bannedCavers = await TCaver.find({ banned: true });

  return res.ok({ banned: bannedCavers.map(toListCaver) });
};
