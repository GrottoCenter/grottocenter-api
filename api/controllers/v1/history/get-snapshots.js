const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const HistoryService = require('../../../services/HistoryService');

module.exports = async (req, res) => {
  try {
    const historyH = await HistoryService.getHHistoriesById(req.params.id);

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(historyH).length === 0) {
      return res.notFound(`History ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treat(
      req,
      null,
      { histories: historyH },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
