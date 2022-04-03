const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TEntrance.count().exec((err, found) => {
    const params = {};
    params.controllerMethod = 'EntranceController.count';
    params.notFoundMessage = 'Problem while getting number of entrances.';

    const count = {};
    count.count = found;
    return ControllerService.treat(req, err, count, params, res);
  });
};
