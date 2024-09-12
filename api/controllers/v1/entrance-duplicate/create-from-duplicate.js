const EntranceService = require('../../../services/EntranceService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to create an entrance duplicate.'
    );
  }

  const id = req.param('id');
  const entranceDuplicate = await TEntranceDuplicate.findOne({ id });
  if (!entranceDuplicate) {
    return res.badRequest(`Could not find duplicate with id ${id}.`);
  }

  const { entrance, nameDescLoc } = entranceDuplicate.content;

  await EntranceService.createEntrance(req, entrance, nameDescLoc);
  await TEntranceDuplicate.destroyOne(id);

  return res.ok();
};
