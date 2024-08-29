const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const { toListFromController } = require('../../../services/mapping/utils');
const {
  toSimpleOrganization,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const parameters = {};
  if (!hasRight) parameters.isDeleted = false;

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
    .populate('names')
    .sort('id ASC')
    .limit(10);

  return ControllerService.treatAndConvert(
    req,
    null,
    organizations,
    {
      controllerMethod: 'GrottoController.findAll',
      notFoundMessage: 'No organizations found.',
    },
    res,
    (data, meta) =>
      toListFromController('organizations', data, toSimpleOrganization, {
        meta,
      })
  );
};
