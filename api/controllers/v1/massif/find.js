const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingV1Service = require('../../../services/MappingV1Service');
const MassifService = require('../../../services/MassifService');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  try {
    const massif = await TMassif.findOne(req.params.id)
      .populate('author')
      .populate('caves')
      .populate('names')
      .populate('descriptions');
    const params = {};
    params.searchedItem = `Massif of id ${req.params.id}`;
    if (!massif) {
      const notFoundMessage = `${params.searchedItem} not found`;
      sails.log.debug(notFoundMessage);
      return res.status(404).send(notFoundMessage);
    }

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
      MappingV1Service.convertToMassifModel
    );
  } catch (e) {
    ErrorService.getDefaultErrorHandler(res)(e);
    return false;
  }
};
