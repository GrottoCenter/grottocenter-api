const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const RightService = require('../../../services/RightService');
const {
  toEntrance,
  toDeletedEntity,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const where = {};
  if (!hasRight) where.isDeleted = false;

  const params = { searchedItem: `Entrance of id ${req.params.id}` };
  const entrance = await EntranceService.getPopulatedEntrance(
    req.params.id,
    where
  );

  if (!entrance) return res.notFound(`${params.searchedItem} not found`);
  return ControllerService.treatAndConvert(
    req,
    null,
    entrance,
    params,
    res,
    entrance.isDeleted && !hasRight ? toDeletedEntity : toEntrance
  );
};
