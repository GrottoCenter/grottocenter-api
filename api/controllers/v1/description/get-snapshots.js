const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleDescription } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const descriptionsH = await DescriptionService.getHDescription(req.params.id);
  if (Object.keys(descriptionsH).length === 0) {
    return res.notFound(`Description ${req.params.id} has no snapshot.`);
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    descriptionsH,
    { controllerMethod: 'DescriptionController.getAllSnapshots' },
    res,
    (data) => toListFromController('descriptions', data, toSimpleDescription)
  );
};
