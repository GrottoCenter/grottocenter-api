const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const RiggingService = require('../../../services/RiggingService');

module.exports = async (req, res) => {
  try {
    const riggingH = await RiggingService.getHRiggingById(req.params.id);

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(riggingH).length === 0) {
      return res.notFound(`Rigging ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treat(
      req,
      null,
      { riggings: riggingH },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
