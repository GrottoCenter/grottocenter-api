const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const MassifService = require('../../../services/MassifService');
const NameService = require('../../../services/NameService');
const DescriptionService = require('../../../services/DescriptionService');

module.exports = async (req, res) => {
  try {
    const massif = await TMassif.findOne(req.params.id)
      .populate('author')
      .populate('names')
      .populate('descriptions')
      .populate('documents');
    const params = {};
    params.searchedItem = `Massif of id ${req.params.id}`;
    if (!massif) {
      return res.notFound(`${params.searchedItem} not found`);
    }

    // Populate caves
    massif.caves = await MassifService.getCaves(massif.id);

    // Populate caves entrances
    await CaveService.setEntrances(massif.caves);
    for (const cave of massif.caves) {
      // eslint-disable-next-line no-await-in-loop
      await NameService.setNames(cave.entrances, 'entrance');
    }

    // Populate networks
    await MassifService.setNetworks(massif);
    await NameService.setNames(massif.networks, 'cave');

    // complete documents descriptions
    if (massif.documents && massif.documents.length > 0) {
      const promisesArray = [];
      for (const document of massif.documents) {
        promisesArray.push(
          DescriptionService.setDocumentDescriptions(document, false)
        );
      }
      await Promise.all(promisesArray);
    }

    massif.geoJson = await MassifService.wktToGeoJson(massif.geogPolygon);

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
