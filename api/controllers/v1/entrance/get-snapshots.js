const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const EntranceService = require('../../../services/EntranceService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toEntrance } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const entrancesH = await EntranceService.getHEntrancesById(
      req.params.id,
      req.query.isNetwork,
      req.token
    );

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(entrancesH).length === 0) {
      return res.notFound(`Entrance ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treatAndConvert(
      req,
      null,
      entrancesH,
      params,
      res,
      (data, meta) =>
        toListFromController('entrances', data, toEntrance, { meta })
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
