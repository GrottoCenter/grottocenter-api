const CaverService = require('../../../services/CaverService');
const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  TCave.findOne(req.params.id)
    .populate('descriptions')
    .populate('documents')
    .populate('descriptions')
    .populate('entrances')
    .populate('histories')
    .populate('id_author')
    .populate('id_reviewer')
    .populate('names')
    .exec(async (err, found) => {
      const params = {};
      params.controllerMethod = 'CaveController.find';
      params.searchedItem = `Cave of id ${req.params.id}`;
      params.notFoundMessage = `${params.searchedItem} not found.`;
      if (err) {
        return res.serverError(
          `An unexpected server error occured when trying to get ${params.searchedItem}`
        );
      }
      let caveResult;
      if (found) {
        caveResult = found;
        caveResult.massifs = await CaveService.getMassifs(caveResult.id);
        await CaveService.setEntrances([caveResult]);
        await NameService.setNames([caveResult], 'cave');
        await NameService.setNames(caveResult?.entrances, 'entrance');
        await NameService.setNames(caveResult?.massifs, 'massif');
        caveResult.descriptions = await DescriptionService.getCaveDescriptions(
          caveResult.id
        );
        caveResult.histories.map(async (h) => {
          // eslint-disable-next-line no-param-reassign
          h.author = await CaverService.getCaver(h.author, req);
          return h;
        });
      }

      return ControllerService.treatAndConvert(
        req,
        err,
        caveResult,
        params,
        res,
        MappingService.convertToCaveModel
      );
    });
};
