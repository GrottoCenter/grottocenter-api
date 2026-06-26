const GeoAssociationService = require('../../../services/GeoAssociationService');

module.exports = async (req, res) => {
  const countryId = req.param('id');
  const organizationId = req.param('organizationId');

  try {
    await GeoAssociationService.removeAssociation(
      'country',
      countryId,
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
    sails.log.error(
      `Error removing organization for country ${countryId}:`,
      err
    );
    return res.serverError(err);
  }
};
