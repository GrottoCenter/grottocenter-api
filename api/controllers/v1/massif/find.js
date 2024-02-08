const ControllerService = require('../../../services/ControllerService');
const MassifService = require('../../../services/MassifService');
const {
  toMassif,
  toDeletedMassif,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const params = { searchedItem: `Massif of id ${req.params.id}` };

  const massif = await MassifService.getPopulatedMassif(req.params.id);
  if (!massif) return res.notFound(`${params.searchedItem} not found`);

  return ControllerService.treatAndConvert(
    req,
    null,
    massif,
    params,
    res,
    massif.isDeleted ? toDeletedMassif : toMassif
  );
};
