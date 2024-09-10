const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const {
  toCave,
  toDeletedEntity,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const where = {};
  if (!hasRight) where.isDeleted = false;

  const params = { searchedItem: `Cave of id ${req.params.id}` };
  const cave = await CaveService.getPopulatedCave(req.params.id, where);

  if (!cave) return res.notFound(`${params.searchedItem} not found`);
  return ControllerService.treatAndConvert(
    req,
    null,
    cave,
    params,
    res,
    cave.isDeleted && !hasRight ? toDeletedEntity : toCave
  );
};
