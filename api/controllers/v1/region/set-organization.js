const GeoAssociationService = require('../../../services/GeoAssociationService');
const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const countryId = req.param('countryId');
  const regionId = req.param('regionId');
  const organizationId = req.param('organizationId');
  const userId = req.token.id;

  const isoCode = `${countryId}-${regionId}`;

  try {
    const result = await GeoAssociationService.setAssociation(
      'region',
      isoCode,
      organizationId,
      userId
    );

    return ControllerService.treat(
      req,
      null,
      {
        id: result.entityId,
        organizationId: result.organizationId,
      },
      {
        controllerMethod: 'TISO31662Controller.setOrganization',
        searchedItem: `Region ${isoCode}`,
      },
      res
    );
  } catch (err) {
    if (err.code === 'E_BAD_REQUEST') {
      return res.badRequest(err.message);
    }
    if (err.code === 'E_NOT_FOUND') {
      return res.notFound({ message: err.message });
    }
    sails.log.error(`Error setting organization for region ${regionId}:`, err);
    return res.serverError(err);
  }
};
