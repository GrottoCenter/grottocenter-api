const ControllerService = require('../../../services/ControllerService');

module.exports = (req, res) => {
  const parameters = {};
  if (req.param('name') !== undefined) {
    parameters.name = {
      like: `%${req.param('name')}%`,
    };
    sails.log.debug(`parameters ${parameters.name.like}`);
  }

  TCaver.find(parameters)
    .sort('id ASC')
    .limit(10)
    .exec((err, found) => {
      const params = {};
      params.controllerMethod = 'CaverController.findAll';
      params.notFoundMessage = 'No cavers found.';
      return ControllerService.treat(req, err, found, params, res);
    });
};
