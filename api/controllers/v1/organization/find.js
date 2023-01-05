const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const GrottoService = require('../../../services/GrottoService');
const {
  toOrganization,
  toDeletedOrganization,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  try {
    const organization = await TGrotto.findOne(req.params.id)
      .populate('author')
      .populate('reviewer')
      .populate('names')
      .populate('cavers')
      .populate('documents')
      .populate('exploredCaves')
      .populate('partnerCaves');
    const params = {};
    params.searchedItem = `Organization of id ${req.params.id}`;
    if (!organization) return res.notFound(`${params.searchedItem} not found`);
    if (organization.isDeleted) {
      return ControllerService.treatAndConvert(
        req,
        null,
        organization,
        params,
        res,
        toDeletedOrganization
      );
    }

    await GrottoService.populateOrganization(organization);
    return ControllerService.treatAndConvert(
      req,
      null,
      organization,
      params,
      res,
      toOrganization
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
