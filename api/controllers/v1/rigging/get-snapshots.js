const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const RiggingService = require('../../../services/RiggingService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleRigging } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const riggingH = await RiggingService.getHRiggingById(req.params.id);

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(riggingH).length === 0) {
      return res.notFound(`Rigging ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treatAndConvert(
      req,
      null,
      riggingH,
      params,
      res,
      (data) => toListFromController('riggings', data, toSimpleRigging)
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
