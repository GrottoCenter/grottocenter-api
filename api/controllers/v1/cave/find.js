const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const {
  toCave,
  toDeletedCave,
} = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const params = {
    controllerMethod: 'CaveController.find',
    searchedItem: `Cave of id ${req.params.id}`,
    notFoundMessage: `Cave of id ${req.params.id} not found.`,
  };

  const cave = await CaveService.getCavePopulated(req.params.id);
  if (!cave) return res.notFound(`${params.searchedItem} not found`);

  return ControllerService.treatAndConvert(
    req,
    null,
    cave,
    params,
    res,
    cave.isDeleted ? toDeletedCave : toCave
  );
};
