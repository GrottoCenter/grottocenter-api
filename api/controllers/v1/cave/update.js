const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');
const RightService = require('../../../services/RightService');

const { checkRight } = sails.helpers;

module.exports = async (req, res) => {
  // Check right
  const hasRight = await checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.CAVE,
      rightAction: RightService.RightActions.EDIT_ANY,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update a cave.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to update a cave.');
  }

  // Check if cave exists
  const caveId = req.param('id');
  const currentCave = await TCave.findOne(caveId);
  if (!currentCave) {
    return res.status(404).send({
      message: `Cave with id ${caveId} not found.`,
    });
  }

  const cleanedData = {
    ...CaveService.getConvertedDataFromClient(req),
    id: caveId,
  };

  try {
    const updatedCave = await TCave.updateOne({
      id: caveId,
    }).set(cleanedData);

    await NameService.setNames([updatedCave], 'cave');

    const params = {};
    params.controllerMethod = 'CaveController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      updatedCave,
      params,
      res,
      MappingService.convertToCaveModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
