const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const NameService = require('../../../services/NameService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
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
    return res.notFound({
      message: `Cave with id ${caveId} not found.`,
    });
  }

  const cleanedData = CaveService.getConvertedDataFromClient(req);

  try {
    const updatedCave = await TCave.updateOne({
      id: caveId,
    }).set(cleanedData);

    // Handle name manually
    // Currently, use only one name per cave (even if the model can handle multiple names)
    await TName.updateOne({
      cave: caveId,
    }).set({
      name: req.param('name')?.text,
      language: req.param('name')?.language,
    });

    await NameService.setNames([updatedCave], 'cave');

    await NotificationService.notifySubscribers(
      req,
      updatedCave,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.CAVE
    );
    const params = {
      controllerMethod: 'CaveController.update',
    };
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
