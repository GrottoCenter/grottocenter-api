const ControllerService = require('../../../services/ControllerService');
const StatisticsRegionService = require('../../../services/StatisticsRegionService');

module.exports = async (req, res) => {
  const { countryId } = req.params;
  const { regionId } = req.params;

  // Check if ISO 3166-2 region exists
  const isoCode = `${countryId}-${regionId}`;
  const region = await TISO31662.findOne({ id: isoCode });
  if (!region) {
    return res.notFound({
      message: `Region ${isoCode} not found.`,
    });
  }

  const [
    nbMassifs,
    nbCaves,
    nbNetworks,
    caveWithMaxDepth,
    caveWithMaxLength,
    nbCavesWhichAreDiving,
    avgDepthAndLength,
    totalLength,
  ] = await Promise.all([
    StatisticsRegionService.getNbMassifsInRegion(isoCode),
    StatisticsRegionService.getNbCavesInRegion(isoCode),
    StatisticsRegionService.getNbNetworksInRegion(isoCode),
    StatisticsRegionService.getCaveWithMaxDepthInRegion(isoCode),
    StatisticsRegionService.getCaveWithMaxLengthInRegion(isoCode),
    StatisticsRegionService.getNbCavesWhichAreDivingInRegion(isoCode),
    StatisticsRegionService.getAvgDepthAndLengthInRegion(isoCode),
    StatisticsRegionService.getTotalLength(isoCode),
  ]);

  const data = {
    nb_massifs:
      nbMassifs && nbMassifs.nb_massifs === null
        ? null
        : Number.parseInt(nbMassifs.nb_massifs, 10),
    nb_caves:
      nbCaves && nbCaves.nb_caves === null
        ? null
        : Number.parseInt(nbCaves.nb_caves, 10),
    nb_networks:
      nbNetworks && nbNetworks.nb_networks === null
        ? null
        : Number.parseInt(nbNetworks.nb_networks, 10),
    cave_with_max_depth: caveWithMaxDepth,
    cave_with_max_length: caveWithMaxLength,
    diving_caves:
      nbCavesWhichAreDiving && nbCavesWhichAreDiving.nb_diving_cave === null
        ? null
        : Number.parseInt(nbCavesWhichAreDiving.nb_diving_cave, 10),
    avg: {
      avg_depth:
        avgDepthAndLength && avgDepthAndLength.avg_depth === null
          ? null
          : Number.parseInt(avgDepthAndLength.avg_depth, 10),
      avg_length:
        avgDepthAndLength && avgDepthAndLength.avg_length === null
          ? null
          : Number.parseInt(avgDepthAndLength.avg_length, 10),
    },
    total_length: {
      value:
        totalLength && totalLength.value === null
          ? null
          : Number.parseInt(totalLength.value, 10),
      nb_data:
        totalLength && totalLength.nb_data === null
          ? null
          : Number.parseInt(totalLength.nb_data, 10),
    },
  };

  return ControllerService.treat(
    req,
    null,
    data,
    { controllerMethod: 'RegionController.get-statistics' },
    res
  );
};
