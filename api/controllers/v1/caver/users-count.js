const CaverService = require('../../../services/CaverService');
const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const countResult = await CaverService.countDistinctUsers();
  const params = { controllerMethod: 'CaverController.usersCount' };
  const count = { count: countResult };
  return ControllerService.treat(req, null, count, params, res);
};
