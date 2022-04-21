const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.ENTRANCE,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update an entrance.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update an entrance.');
  }

  // Check if entrance exists
  const entranceId = req.param('id');
  const currentEntrance = await TEntrance.findOne(entranceId);
  if (!currentEntrance) {
    return res.status(404).send({
      message: `Entrance of id ${entranceId} not found.`,
    });
  }

  const cleanedData = {
    ...EntranceService.getConvertedDataFromClientRequest(req),
    id: entranceId,
  };

  try {
    const updatedEntrance = await TEntrance.updateOne({
      id: entranceId,
    }).set(cleanedData);

    await NameService.setNames([updatedEntrance], 'entrance');

    const params = {};
    params.controllerMethod = 'EntranceController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      updatedEntrance,
      params,
      res,
      MappingService.convertToEntranceModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
