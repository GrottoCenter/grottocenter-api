const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const MappingV1Service = require('../../../services/MappingV1Service');

module.exports = (req, res) => {
  const params = {};
  params.searchedItem = 'Random entrance';
  EntranceService.findRandom()
    .then((result) => {
      if (!result) {
        return res.notFound();
      }
      return ControllerService.treatAndConvert(
        req,
        null,
        result,
        params,
        res,
        MappingV1Service.convertToEntranceModel
      );
    })
    .catch((err) =>
      ControllerService.treatAndConvert(
        req,
        err,
        undefined,
        params,
        res,
        MappingV1Service.convertToEntranceModel
      )
    );
};
