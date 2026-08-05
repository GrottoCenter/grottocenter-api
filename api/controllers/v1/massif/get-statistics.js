const ControllerService = require('../../../services/ControllerService');
const StatisticsMassifService = require('../../../services/StatisticsMassifService');

module.exports = async (req, res) => {
  const massifId = req.params.id;

  try {
    // Existence check against the real table, not the materialized view.
    // A massif with no cached stats (stale/empty view) is not "not found".
    const massif = await TMassif.findOne({ id: massifId, isDeleted: false });
    if (!massif) {
      return res.notFound({ message: `Massif of id ${massifId} not found` });
    }

    // Launching all requests at the same time
    const [
      nbCaves,
      nbNetworks,
      caveWithMaxDepth,
      caveWithMaxLength,
      nbCavesWhichAreDiving,
      avgDepthAndLength,
      totalLength,
    ] = await Promise.all([
      StatisticsMassifService.getNbCavesInMassif(massifId),
      StatisticsMassifService.getNbNetworksInMassif(massifId),
      StatisticsMassifService.getCaveWithMaxDepthInMassif(massifId),
      StatisticsMassifService.getCaveWithMaxLengthInMassif(massifId),
      StatisticsMassifService.getNbCavesWhichAreDivingInMassif(massifId),
      StatisticsMassifService.getAvgDepthAndLengthInMassif(massifId),
      StatisticsMassifService.getTotalLength(massifId),
    ]);

    // to avoid that the function parseInt returns NaN when the value is null, we test the value before
    // if the value is null, we return null
    const data = {
      nb_caves:
        nbCaves?.nb_caves == null ? null : parseInt(nbCaves.nb_caves, 10),
      nb_networks:
        nbNetworks?.nb_networks == null
          ? null
          : parseInt(nbNetworks.nb_networks, 10),
      cave_with_max_depth: caveWithMaxDepth,
      cave_with_max_length: caveWithMaxLength,
      diving_caves:
        nbCavesWhichAreDiving?.nb_diving_cave == null
          ? null
          : parseInt(nbCavesWhichAreDiving.nb_diving_cave, 10),
      avg: {
        avg_depth:
          avgDepthAndLength?.avg_depth == null
            ? null
            : parseInt(avgDepthAndLength.avg_depth, 10),
        avg_length:
          avgDepthAndLength?.avg_length == null
            ? null
            : parseInt(avgDepthAndLength.avg_length, 10),
      },
      total_length: {
        value:
          totalLength?.value == null ? null : parseInt(totalLength.value, 10),
        nb_data:
          totalLength?.nb_data == null
            ? null
            : Number.parseInt(totalLength.nb_data, 10),
      },
    };

    return ControllerService.treat(
      req,
      null,
      data,
      { controllerMethod: 'MassifController.get-statistics' },
      res
    );
  } catch (err) {
    return ControllerService.treat(
      req,
      err,
      null,
      { controllerMethod: 'MassifController.get-statistics' },
      res
    );
  }
};
