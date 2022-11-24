const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const { toEntrance } = require('../../../services/mapping/converters');

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
        toEntrance
      );
    })
    .catch((err) =>
      ControllerService.treatAndConvert(
        req,
        err,
        undefined,
        params,
        res,
        toEntrance
      )
    );
};
