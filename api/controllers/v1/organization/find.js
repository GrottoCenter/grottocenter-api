const ControllerService = require('../../../services/ControllerService');
const GrottoService = require('../../../services/GrottoService');
const {
  toOrganization,
  toDeletedOrganization,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const params = { searchedItem: `Organization of id ${req.params.id}` };
  const organization = await GrottoService.getPopulatedOrganization(
    req.params.id
  );
  if (!organization) return res.notFound(`${params.searchedItem} not found`);
  return ControllerService.treatAndConvert(
    req,
    null,
    organization,
    params,
    res,
    organization.isDeleted ? toDeletedOrganization : toOrganization
  );
};
