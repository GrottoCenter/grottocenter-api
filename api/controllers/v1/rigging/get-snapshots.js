const ControllerService = require('../../../services/ControllerService');
const RiggingService = require('../../../services/RiggingService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleRigging } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const riggingsH = await RiggingService.getHRiggings(req.params.id);
  if (Object.keys(riggingsH).length === 0) {
    return res.notFound(`Rigging ${req.params.id} has no snapshot.`);
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    riggingsH,
    { controllerMethod: 'RiggingController.getAllSnapshots' },
    res,
    (data) => toListFromController('riggings', data, toSimpleRigging)
  );
};
