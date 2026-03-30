const ControllerService = require('../../../services/ControllerService');
const DataQualityComputeService = require('../../../services/DataQualityComputeService');
const EntranceService = require('../../../services/EntranceService');
const RightService = require('../../../services/RightService');
const {
  toEntrance,
  toDeletedEntity,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const entranceId = Number(req.params.id);

  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const where = {};
  if (!hasRight) where.isDeleted = false;

  const params = { searchedItem: `Entrance of id ${entranceId}` };

  // Fetch entrance and quality data in parallel.
  // The quality query may return null for deleted entrances (the materialized
  // view filters is_deleted = false) or for newly created entrances not yet
  // in the view. In 404 cases the quality result is simply discarded.
  const [entrance, qualityRow] = await Promise.all([
    EntranceService.getPopulatedEntrance(entranceId, where),
    DataQualityComputeService.getEntranceQualityById(entranceId),
  ]);

  if (!entrance) return res.notFound(`${params.searchedItem} not found`);

  return ControllerService.treatAndConvert(
    req,
    null,
    { ...entrance, qualityData: qualityRow },
    params,
    res,
    entrance.isDeleted && !hasRight ? toDeletedEntity : toEntrance
  );
};
