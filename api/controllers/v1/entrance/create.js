const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');

module.exports = async (req, res) => {
  const name = req.param('name');
  if (!name?.text || !name?.language) {
    return res.badRequest(
      'You must provide a name (with a language) for the new entrance'
    );
  }

  const caveId = req.param('cave');
  const cave = TCave.findOne(caveId);
  if (!cave || cave.isDeleted) {
    return res.badRequest(`The cave with id ${caveId} does not exist.`);
  }

  // Get data & create entrance
  const cleanedData = {
    ...EntranceService.getConvertedDataFromClientRequest(req),
    author: req.token.id,
    dateInscription: new Date(),
    isOfInterest: false,
  };

  const nameDescLocData =
    EntranceService.getConvertedNameFromClientRequest(req);

  const newEntrancePopulated = await EntranceService.createEntrance(
    req,
    cleanedData,
    nameDescLocData
  );

  return ControllerService.treat(
    req,
    null,
    newEntrancePopulated,
    { controllerMethod: 'EntranceController.create' },
    res
  );
};
