const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const DescriptionService = require('../../../services/DescriptionService');
const { toListFromController } = require('../../../services/mapping/utils');
const { toSimpleDescription } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const descriptionsH = await DescriptionService.getHDescriptionsById(
      req.params.id
    );

    const params = {};
    params.controllerMethod = 'GrottoController.getAllSnapshots';

    if (Object.keys(descriptionsH).length === 0) {
      return res.notFound(`Description ${req.params.id} has no snapshot.`);
    }

    return ControllerService.treatAndConvert(
      req,
      null,
      descriptionsH,
      params,
      res,
      (data) => toListFromController('descriptions', data, toSimpleDescription)
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
