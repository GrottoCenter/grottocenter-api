const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await TMassif.count({ isDeleted: false });
  const params = {
    controllerMethod: 'MassifController.count',
    notFoundMessage: 'Problem while getting number of massifs.',
  };
  return ControllerService.treat(req, null, { count }, params, res);
};
