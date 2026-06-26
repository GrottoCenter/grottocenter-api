const GeoAssociationService = require('../../../services/GeoAssociationService');

module.exports = async (req, res) => {
  const massifId = req.param('id');
  const organizationId = req.param('organizationId');

  try {
    await GeoAssociationService.removeAssociation(
      'massif',
      massifId,
      organizationId
    );
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'E_BAD_REQUEST') {
      return res.badRequest(err.message);
    }
    if (err.code === 'E_NOT_FOUND') {
      return res.notFound({ message: err.message });
    }
    sails.log.error(`Error removing organization for massif ${massifId}:`, err);
    return res.serverError(err);
  }
};
