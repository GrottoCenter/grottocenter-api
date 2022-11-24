const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MassifService = require('../../../services/MassifService');
const NameService = require('../../../services/NameService');
const DescriptionService = require('../../../services/DescriptionService');
const { toMassif } = require('../../../services/mapping/converters');

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

    // Populate entrances
    massif.entrances = await MassifService.getEntrances(massif.id);
    await NameService.setNames(massif.entrances, 'entrance');

    // Populate networks
    massif.networks = await MassifService.getNetworks(massif.id);
    await NameService.setNames(massif.networks, 'cave');

    // Complete documents descriptions
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
      toMassif
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
