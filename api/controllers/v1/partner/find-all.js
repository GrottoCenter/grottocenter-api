const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  const parameters = {};
  if (req.param('name')) {
    parameters.name = {
      like: `%${req.param('name')}%`,
    };
  }

  TGrotto.find(parameters)
    .sort('id ASC')
    .exec((err, found) => {
      const params = {};
      params.controllerMethod = 'PartnerController.findAll';
      params.notFoundMessage = 'No partners found.';
      return ControllerService.treat(req, err, found, params, res);
    });
};
