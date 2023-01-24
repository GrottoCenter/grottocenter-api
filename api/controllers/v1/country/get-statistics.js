const ControllerService = require('../../../services/ControllerService');
const StatisticsCountryService = require('../../../services/StatisticsCountryService');
const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  try {
    const params = {
      controllerMethod: 'CountryController.get-statistics',
    };

    if (!req.params.id) {
      return ControllerService.treat(
        req,
        'Missing country id',
        null,
        params,
        res
      );
    }

    const countryId = req.params.id;

    // Check if the country id matches with a country in our view
    const country = await StatisticsCountryService.isCountryInView(countryId);
    if (!country) {
      params.notFoundMessage = `Country of id ${countryId} not found`;
      return ControllerService.treat(req, null, null, params, res);
    }

    const nbMassifs = StatisticsCountryService.getNbMassifsInCountry(countryId);

    const nbCaves = StatisticsCountryService.getNbCavesInCountry(countryId);

    const nbNetworks =
      StatisticsCountryService.getNbNetworksInCountry(countryId);

    const caveWithMaxDepth =
      StatisticsCountryService.getCaveWithMaxDepthInCountry(countryId);

    const caveWithMaxLength =
      StatisticsCountryService.getCaveWithMaxLengthInCountry(countryId);

    const nbCavesWhichAreDiving =
      StatisticsCountryService.getNbCavesWhichAreDivingInCountry(countryId);

    const avgDepthAndLength =
      StatisticsCountryService.getAvgDepthAndLengthInCountry(countryId);

    const totalLength = StatisticsCountryService.getTotalLength(countryId);

    return Promise.all([
      nbMassifs,
      nbCaves,
      nbNetworks,
      caveWithMaxDepth,
      caveWithMaxLength,
      nbCavesWhichAreDiving,
      avgDepthAndLength,
      totalLength,
    ]).then((values) => {
      const data = {
        nb_massifs:
          values[0].nb_massifs === null
            ? null
            : Number.parseInt(values[0].nb_massifs, 10),
        nb_caves:
          values[1].nb_caves === null
            ? null
            : Number.parseInt(values[1].nb_caves, 10),
        nb_networks:
          values[2].nb_networks === null
            ? null
            : Number.parseInt(values[2].nb_networks, 10),
        cave_with_max_depth: values[3],
        cave_with_max_length: values[4],
        diving_caves:
          values[5].nb_diving_cave === null
            ? null
            : Number.parseInt(values[5].nb_diving_cave, 10),
        avg: {
          avg_depth:
            values[6].avg_depth === null
              ? null
              : Number.parseInt(values[6].avg_depth, 10),
          avg_length:
            values[6].avg_length === null
              ? null
              : Number.parseInt(values[6].avg_length, 10),
        },
        total_length: {
          value:
            values[7].value === null
              ? null
              : Number.parseInt(values[7].value, 10),
          nb_data:
            values[7].nb_data === null
              ? null
              : Number.parseInt(values[7].nb_data, 10),
        },
      };

      return ControllerService.treat(req, null, data, params, res);
    });
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
