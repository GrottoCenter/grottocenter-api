const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');
const { toCave } = require('../../../services/mapping/converters');
const { toListFromController } = require('../../../services/mapping/utils');
const NameService = require('../../../services/NameService');

module.exports = async (req, res) => {
  const parameters = {};

  return TCave.find(parameters)
    .populate('id_author')
    .populate('entrances')
    .populate('histories')
    .populate('names')
    .sort('id ASC')
    .limit(10)
    .exec(async (err, found) => {
      const params = {};
      params.controllerMethod = 'CaveController.findAll';
      params.searchedItem = 'all caves';
      params.notFoundMessage = 'No caves found.';
      if (err) {
        return res.serverError(
          `An unexpected server error occured when trying to get ${params.searchedItem}`
        );
      }
      await NameService.setNames(found, 'cave');
      const populatePromise = found.map((cave) => {
        cave.histories.map(async (h) => {
          // eslint-disable-next-line no-param-reassign
          h.author = await CaverService.getCaver(h.author, req.token);
          return h;
        });
        return cave;
      });
      Promise.all(populatePromise);
      return ControllerService.treatAndConvert(
        req,
        err,
        found,
        params,
        res,
        (data) => toListFromController('caves', data, toCave)
      );
    });
};
