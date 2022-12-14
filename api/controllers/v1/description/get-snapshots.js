const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const DescriptionService = require('../../../services/DescriptionService');

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

    return ControllerService.treat(
      req,
      null,
      { descriptions: descriptionsH },
      params,
      res
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
