const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const HistoryService = require('../../../services/HistoryService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleHistory } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const historyH = await HistoryService.getHHistoriesById(req.params.id);

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(historyH).length === 0) {
      return res.notFound(`History ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treatAndConvert(
      req,
      null,
      historyH,
      params,
      res,
      (data) => toListFromController('histories', data, toSimpleHistory)
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
