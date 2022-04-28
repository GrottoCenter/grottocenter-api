const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const MassifService = require('../../../services/MassifService');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  try {
    const massif = await TMassif.findOne(req.params.id)
      .populate('author')
      .populate('names')
      .populate('descriptions');
    const params = {};
    params.searchedItem = `Massif of id ${req.params.id}`;
    if (!massif) {
      const notFoundMessage = `${params.searchedItem} not found`;
      sails.log.debug(notFoundMessage);
      return res.status(404).send(notFoundMessage);
    }

    // Populate caves
    massif.caves = await MassifService.getCaves(massif);

    // Populate caves entrances
    await CaveService.setEntrances(massif.caves);
    for (const cave of massif.caves) {
      // eslint-disable-next-line no-await-in-loop
      await NameService.setNames(cave.entrances, 'entrance');
    }

    // Populate networks
    await MassifService.setNetworks(massif);
    await NameService.setNames(massif.networks, 'cave');

    return ControllerService.treatAndConvert(
      req,
      null,
      massif,
      params,
      res,
      MappingService.convertToMassifModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
