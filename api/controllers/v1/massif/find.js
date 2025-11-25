const ControllerService = require('../../../services/ControllerService');
const MassifService = require('../../../services/MassifService');
const RightService = require('../../../services/RightService');
const {
  toMassif,
  toDeletedEntity,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const massifId = Number(req.params.id);

  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const params = { searchedItem: `Massif of id ${massifId}` };
  const massif = await MassifService.getPopulatedMassif(massifId);

  if (!massif) return res.notFound(`${params.searchedItem} not found`);
  return ControllerService.treatAndConvert(
    req,
    null,
    massif,
    params,
    res,
    massif.isDeleted && !hasRight ? toDeletedEntity : toMassif
  );
};
