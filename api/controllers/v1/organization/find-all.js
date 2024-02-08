const ControllerService = require('../../../services/ControllerService');
const {
  toSimpleOrganization,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const parameters = {};
  if (req.param('name')) {
    parameters.name = {
      like: `%${req.param('name')}%`,
    };
  }
  if (req.param('region')) {
    parameters.region = {
      like: `%${req.param('region')}%`,
    };
  }

  const organizations = await TGrotto.find(parameters)
    .populate('author')
    .sort('id ASC')
    .limit(10);

  const params = {
    controllerMethod: 'GrottoController.findAll',
    notFoundMessage: 'No organizations found.',
  };

  return ControllerService.treatAndConvert(
    req,
    null,
    organizations,
    params,
    res,
    toSimpleOrganization
  );
};
