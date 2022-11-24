const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const GrottoService = require('../../../services/GrottoService');
const MappingService = require('../../../services/mapping/MappingService');

module.exports = async (req, res) => {
  try {
    const organization = await TGrotto.findOne(req.params.id)
      .populate('names')
      .populate('cavers')
      .populate('documents')
      .populate('exploredCaves')
      .populate('partnerCaves');
    if (!organization) {
      return res.notFound({
        message: `Organization of id ${req.params.id} not found.`,
      });
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
