const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toEntrance } = require('../../../services/mapping/converters');
const readBoolParam = require('../../../utils/readBoolParam');

module.exports = async (req, res) => {
  const { value: isNetwork, error: isNetworkError } = readBoolParam(
    req,
    'isNetwork',
    false
  );
  if (isNetworkError) return res.badRequest(isNetworkError);

  const entrancesH = await EntranceService.getHEntrancesById(
    req.params.id,
    isNetwork,
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
