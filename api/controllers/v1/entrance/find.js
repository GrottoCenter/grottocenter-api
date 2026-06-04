const ControllerService = require('../../../services/ControllerService');
const DataQualityComputeService = require('../../../services/DataQualityComputeService');
const EntranceService = require('../../../services/EntranceService');
const RightService = require('../../../services/RightService');
const GuidelineService = require('../../../services/GuidelineService');
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

  // Fetch entrance first to avoid unnecessary queries if it doesn't exist
  const entrance = await EntranceService.getPopulatedEntrance(
    entranceId,
    where
  );

  if (!entrance) return res.notFound(`${params.searchedItem} not found`);

  // Fetch quality data and guidelines.
  // The quality query may return null for deleted entrances (the materialized
  // view filters is_deleted = false) or for newly created entrances not yet
  // in the view.
  const [qualityRow, guidelines] = await Promise.all([
    DataQualityComputeService.getEntranceQualityById(entranceId),
    GuidelineService.getGuidelinesForEntrance(entrance),
  ]);

  return ControllerService.treatAndConvert(
    req,
    null,
    { ...entrance, qualityData: qualityRow, guidelines },
    params,
    res,
    entrance.isDeleted && !hasRight ? toDeletedEntity : toEntrance
  );
};
