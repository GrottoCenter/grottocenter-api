const ControllerService = require('../../../services/ControllerService');
const GrottoService = require('../../../services/GrottoService');
const RightService = require('../../../services/RightService');
const {
  toDeletedEntity,
  toOrganization,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const organizationId = Number(req.params.id);

  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const params = { searchedItem: `Organization of id ${organizationId}` };
  const organization =
    await GrottoService.getPopulatedOrganization(organizationId);

  if (!organization) return res.notFound(`${params.searchedItem} not found`);
  return ControllerService.treatAndConvert(
    req,
    null,
    organization,
    params,
    res,
    organization.isDeleted && !hasRight ? toDeletedEntity : toOrganization
  );
};
