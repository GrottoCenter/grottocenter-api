const ControllerService = require('../../../services/ControllerService');
const DashboardDataMassifService = require('../../../services/StatisticsMassifService');
const ErrorService = require('../../../services/ErrorService');

module.exports = async (req, res) => {
  try {
    const params = {
      controllerMethod: 'MassifController.get-statistics',
    };

    // Chek if massif id is present in the params request
    if (!req.params.id) {
      return ControllerService.treat(
        req,
        'Missing massif id',
        null,
        params,
        res
      );
    }

    const massifId = req.params.id;

    // Check if the massif id matches with a massif in our view
    const massif = await DashboardDataMassifService.isMassifInView(massifId);
    if (!massif) {
      params.notFoundMessage = `Massif of id ${massifId} not found`;
      return ControllerService.treat(req, null, null, params, res);
    }

    // Everything is good we can prepare our requests
    const caveWithMaxDepth =
      DashboardDataMassifService.getCaveWithMaxDepthInMassif(massifId);

    const nbCaves = DashboardDataMassifService.getNbCavesInMassif(massifId);

    const nbNetworks =
      DashboardDataMassifService.getNbNetworksInMassif(massifId);

    const caveWithMaxLength =
      DashboardDataMassifService.getCaveWithMaxLengthInMassif(massifId);

    const nbCavesWhichAreDiving =
      DashboardDataMassifService.getNbCavesWhichAreDivingInMassif(massifId);

    const avgDepthAndLength =
      DashboardDataMassifService.getAvgDepthAndLengthInMassif(massifId);

    const totalLength = DashboardDataMassifService.getTotalLength(massifId);

    // Launching all requests at the same time
    return Promise.all([
      nbCaves,
      nbNetworks,
      caveWithMaxDepth,
      caveWithMaxLength,
      nbCavesWhichAreDiving,
      avgDepthAndLength,
      totalLength,
    ]).then((values) => {
      // to avoid that the function parseInt returns NaN when the value is null, we test the value before
      // if the value is null, we return null
      const data = {
        nb_caves:
          values[0].nb_caves === null
            ? null
            : Number.parseInt(values[0].nb_caves, 10),
        nb_networks:
          values[1].nb_networks === null
            ? null
            : Number.parseInt(values[1].nb_networks, 10),
        cave_with_max_depth: values[2],
        cave_with_max_length: values[3],
        diving_caves:
          values[4].nb_diving_cave === null
            ? null
            : Number.parseInt(values[4].nb_diving_cave, 10),
        avg: {
          avg_depth:
            values[5].avg_depth === null
              ? null
              : Number.parseInt(values[5].avg_depth, 10),
          avg_length:
            values[5].avg_length === null
              ? null
              : Number.parseInt(values[5].avg_length, 10),
        },
        total_length: {
          value:
            values[6].value === null
              ? null
              : Number.parseInt(values[6].value, 10),
          nb_data:
            values[6].nb_data === null
              ? null
              : Number.parseInt(values[6].nb_data, 10),
        },
      };

      return ControllerService.treat(req, null, data, params, res);
    });
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
