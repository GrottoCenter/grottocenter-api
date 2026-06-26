const GeoAssociationService = require('../../../services/GeoAssociationService');

module.exports = async (req, res) => {
  const countryId = req.param('countryId');
  const regionId = req.param('regionId');
  const organizationId = req.param('organizationId');

  const isoCode = `${countryId}-${regionId}`;

  try {
    await GeoAssociationService.removeAssociation(
      'region',
      isoCode,
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
    sails.log.error(`Error removing organization for region ${regionId}:`, err);
    return res.serverError(err);
  }
};
