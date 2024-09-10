const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toEntrance } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const entrancesH = await EntranceService.getHEntrancesById(
    req.params.id,
    req.query.isNetwork,
    req.token
  );

  if (Object.keys(entrancesH).length === 0) {
    return res.notFound(`Entrance ${req.params.id} has no snapshot.`);
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    entrancesH,
    { controllerMethod: 'EntranceController.getAllSnapshots' },
    res,
    (data, meta) =>
      toListFromController('entrances', data, toEntrance, { meta })
  );
};
