const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const count = await CaverService.countDistinctUsers();
  const params = { controllerMethod: 'CaverController.usersCount' };
  return ControllerService.treat(req, null, { count }, params, res);
};
