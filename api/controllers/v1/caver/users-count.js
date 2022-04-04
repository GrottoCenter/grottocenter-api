const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const nbUsers = await CaverService.countDistinctUsers();
  const params = { controllerMethod: 'CaverController.usersCount' };
  const count = { count: nbUsers };
  return ControllerService.treat(req, null, count, params, res);
};
