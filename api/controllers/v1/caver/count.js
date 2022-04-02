const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TCaver.count().exec((err, found) => {
    const params = {};
    params.controllerMethod = 'CaverController.count';
    params.notFoundMessage = 'Problem while getting number of cavers.';

    const count = {};
    count.count = found;
    return ControllerService.treat(req, err, count, params, res);
  });
};
