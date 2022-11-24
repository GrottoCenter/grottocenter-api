const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const MappingService = require('../../../services/mapping/MappingService');

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
        MappingService.convertToEntranceModel
      );
    })
    .catch((err) =>
      ControllerService.treatAndConvert(
        req,
        err,
        undefined,
        params,
        res,
        MappingService.convertToEntranceModel
      )
    );
};
