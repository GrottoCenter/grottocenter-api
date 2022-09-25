const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

const { checkIfExists } = sails.helpers;
const checkRight = sails.helpers.checkRight.with;

module.exports = async (req, res) => {
  const hasRight = await checkRight({
    groups: req.token.groups,
    rightEntity: RightService.RightEntities.ENTRANCE,
    rightAction: RightService.RightActions.EDIT_ANY,
  }).intercept('rightNotFound', () =>
    res.serverError(
      'A server error occured when checking your right to move an entrance to another cave.'
    )
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to move an entrance to another cave.'
    );
  }

  // Check if entrance exists
  const entranceId = req.param('entranceId');
  if (!(await checkIfExists('id', entranceId, TEntrance))) {
    return res.notFound({
      message: `Entrance of id ${entranceId} not found.`,
    });
  }

  // Check if cave exists
  const destinationCaveId = req.param('caveId');
  if (!(await checkIfExists('id', destinationCaveId, TCave))) {
    return res.notFound({
      message: `Cave of id ${destinationCaveId} not found.`,
    });
  }

  try {
    // Remove entrance from initial cave and possibly delete initial cave
    const entrance = await TEntrance.findOne(entranceId);

    await TCave.removeFromCollection(entrance.cave, 'entrances', [entranceId]);
    const initialCave = await TCave.findOne(entrance.cave).populate(
      'entrances'
    );

    if (initialCave.entrances.length === 0) {
      await TCave.update(initialCave.id).set({
        redirect_to: destinationCaveId,
      });
      await CaveService.deleteCave(req, initialCave.id);
    }

    // Add entrance to destination cave
    await TCave.addToCollection(destinationCaveId, 'entrances', [entranceId]);

    // Return populated entrance
    const updatedEntrance = await TEntrance.findOne(entranceId).populate(
      'cave'
    );
    const params = {
      controllerMethod: 'EntranceController.moveToCave',
    };
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
