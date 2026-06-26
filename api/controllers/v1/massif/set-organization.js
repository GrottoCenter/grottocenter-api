const GeoAssociationService = require('../../../services/GeoAssociationService');
const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  const massifId = req.param('id');
  const organizationId = req.param('organizationId');
  const userId = req.token.id;

  try {
    const result = await GeoAssociationService.setAssociation(
      'massif',
      massifId,
      organizationId,
      userId
    );

    return ControllerService.treat(
      req,
      null,
      {
        id: Number(result.entityId),
        organizationId: result.organizationId,
      },
      {
        controllerMethod: 'Massif.setOrganization',
        searchedItem: `Massif ${massifId}`,
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
    sails.log.error(`Error setting organization for massif ${massifId}:`, err);
    return res.serverError(err);
  }
};
