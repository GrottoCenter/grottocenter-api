const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const MappingV1Service = require('../../../services/MappingV1Service');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  TCave.findOne(req.params.id)
    .populate('id_author')
    .populate('id_reviewer')
    .populate('entrances')
    .populate('descriptions')
    .populate('histories')
    .populate('documents')
    .populate('names')
    .exec(async (err, found) => {
      const params = {};
      params.controllerMethod = 'CaveController.find';
      params.searchedItem = `Cave of id ${req.params.id}`;
      params.notFoundMessage = `${params.searchedItem} not found.`;
      if (err) {
        sails.log.error(err);
        return res.serverError(
          `An unexpected server error occured when trying to get ${params.searchedItem}`
        );
      }
      if (found) {
        await NameService.setNames([found], 'cave');
        found.histories.map(async (h) => {
          // eslint-disable-next-line no-param-reassign
          h.author = await CaverService.getCaver(h.author, req);
          return h;
        });
      }

      return ControllerService.treatAndConvert(
        req,
        err,
        found,
        params,
        res,
        MappingV1Service.convertToCaveModel
      );
    });
};
