const ControllerService = require('../../../services/ControllerService');
const MassifService = require('../../../services/MassifService');
const RightService = require('../../../services/RightService');
const GuidelineService = require('../../../services/GuidelineService');
const GeoAssociationService = require('../../../services/GeoAssociationService');
const {
  toMassif,
  toDeletedEntity,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const massifId = Number(req.params.id);
  const params = { searchedItem: `Massif of id ${massifId}` };

  try {
    const hasRight = RightService.hasGroup(
      req.token?.groups,
      RightService.G.MODERATOR
    );

    const massif = await MassifService.getPopulatedMassif(massifId);

    if (!massif) return res.notFound(`${params.searchedItem} not found`);

    const guidelines = await GuidelineService.getGuidelinesForEntity(
      'massif',
      String(massifId)
    );

    massif.organizations =
      await GeoAssociationService.getFormattedOrganizations('massif', massifId);

    return ControllerService.treatAndConvert(
      req,
      null,
      { ...massif, guidelines },
      params,
      res,
      massif.isDeleted && !hasRight ? toDeletedEntity : toMassif
    );
  } catch (err) {
    return ControllerService.treat(req, err, null, params, res);
  }
};
