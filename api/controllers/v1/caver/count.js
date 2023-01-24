const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  TCaver.count().exec((err, found) => {
    const params = {
      controllerMethod: 'CaverController.count',
      notFoundMessage: 'Problem while getting number of cavers.',
    };
    return ControllerService.treat(req, err, { count: found }, params, res);
  });
};
