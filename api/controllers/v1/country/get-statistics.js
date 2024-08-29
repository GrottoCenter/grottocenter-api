const ControllerService = require('../../../services/ControllerService');
const StatisticsCountryService = require('../../../services/StatisticsCountryService');

module.exports = async (req, res) => {
  // Check if the country id matches with a country in our view
  const countryId = req.params.id;
  const country = await StatisticsCountryService.isCountryInView(countryId);
  if (!country) {
    return res.notFound({ message: `Country with id ${countryId} not found.` });
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
    StatisticsCountryService.getNbMassifsInCountry(countryId),
    StatisticsCountryService.getNbCavesInCountry(countryId),
    StatisticsCountryService.getNbNetworksInCountry(countryId),
    StatisticsCountryService.getCaveWithMaxDepthInCountry(countryId),
    StatisticsCountryService.getCaveWithMaxLengthInCountry(countryId),
    StatisticsCountryService.getNbCavesWhichAreDivingInCountry(countryId),
    StatisticsCountryService.getAvgDepthAndLengthInCountry(countryId),
    StatisticsCountryService.getTotalLength(countryId),
  ]);

  const data = {
    nb_massifs:
      nbMassifs.nb_massifs === null
        ? null
        : Number.parseInt(nbMassifs.nb_massifs, 10),
    nb_caves:
      nbCaves.nb_caves === null ? null : Number.parseInt(nbCaves.nb_caves, 10),
    nb_networks:
      nbNetworks.nb_networks === null
        ? null
        : Number.parseInt(nbNetworks.nb_networks, 10),
    cave_with_max_depth: caveWithMaxDepth,
    cave_with_max_length: caveWithMaxLength,
    diving_caves:
      nbCavesWhichAreDiving.nb_diving_cave === null
        ? null
        : Number.parseInt(nbCavesWhichAreDiving.nb_diving_cave, 10),
    avg: {
      avg_depth:
        avgDepthAndLength.avg_depth === null
          ? null
          : Number.parseInt(avgDepthAndLength.avg_depth, 10),
      avg_length:
        avgDepthAndLength.avg_length === null
          ? null
          : Number.parseInt(avgDepthAndLength.avg_length, 10),
    },
    total_length: {
      value:
        totalLength.value === null
          ? null
          : Number.parseInt(totalLength.value, 10),
      nb_data:
        totalLength.nb_data === null
          ? null
          : Number.parseInt(totalLength.nb_data, 10),
    },
  };

  return ControllerService.treat(
    req,
    null,
    data,
    { controllerMethod: 'CountryController.get-statistics' },
    res
  );
};
