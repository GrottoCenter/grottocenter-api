const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const EntranceService = require('../../../services/EntranceService');

module.exports = async (req, res) => {
  try {
    const entrancesH = await EntranceService.getHEntrancesById(
      req.params.id,
      req.query.isNetwork
    );

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(entrancesH).length === 0) {
      return res.notFound(`Entrance ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treat(
      req,
      null,
      { entrances: entrancesH },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
