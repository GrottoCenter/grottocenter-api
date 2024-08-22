const ControllerService = require('../../../services/ControllerService');
const HistoryService = require('../../../services/HistoryService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleHistory } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const historiesH = await HistoryService.getHHistories(req.params.id);
  if (Object.keys(historiesH).length === 0) {
    return res.notFound(`History ${req.params.id} has no snapshot.`);
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    historiesH,
    { controllerMethod: 'HistoryController.getAllSnapshots' },
    res,
    (data) => toListFromController('histories', data, toSimpleHistory)
  );
};
