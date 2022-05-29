const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const GrottoService = require('../../../services/GrottoService');
const MappingService = require('../../../services/MappingService');

module.exports = async (req, res) => {
  try {
    const organization = await TGrotto.findOne(req.params.id)
      .populate('names')
      .populate('cavers')
      .populate('documents')
      .populate('exploredCaves')
      .populate('partnerCaves');
    if (!organization) {
      const message = `Organization of id ${req.params.id} not found.`;
      sails.log.error(message);
      return res.status(404).send({ message });
    }
    const params = {};
    params.searchedItem = `Organization of id ${req.params.id}`;
    await GrottoService.populateOrganization(organization);
    return ControllerService.treatAndConvert(
      req,
      null,
      organization,
      params,
      res,
      MappingService.convertToOrganizationModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
