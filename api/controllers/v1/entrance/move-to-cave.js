const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const CaveService = require('../../../services/CaveService');
const { toEntrance } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const entranceId = req.param('entranceId');
  const entrance = await TEntrance.findOne(entranceId);
  if (!entrance || entrance.isDeleted) {
    return res.notFound({ message: `Entrance of id ${entranceId} not found.` });
  }

  const destinationCaveId = parseInt(req.param('caveId'), 10);
  const destinationCave = await TCave.findOne(destinationCaveId);
  if (!destinationCave || destinationCave.isDeleted) {
    return res.notFound({
      message: `Cave of id ${destinationCaveId} not found.`,
    });
  }

  const initialCaveId = entrance.cave;

  // Single atomic update — produces one h_entrance snapshot (old cave → new cave)
  await TEntrance.updateOne({ id: entranceId }).set({
    cave: destinationCaveId,
    reviewer: req.token.id,
  });

  // Soft-delete the initial cave if it has no remaining entrances
  const initialCave = await TCave.findOne(initialCaveId).populate('entrances');
  if (initialCave.entrances.length === 0) {
    await TCave.update(initialCaveId).set({ redirectTo: destinationCaveId });
    await TCave.destroyOne({ id: initialCaveId }); // Soft delete
    await CaveService.deleteInSearch(initialCaveId);
  }

  // Return populated entrance
  const populatedEntrance =
    await EntranceService.getPopulatedEntrance(entranceId);

  return ControllerService.treatAndConvert(
    req,
    null,
    populatedEntrance,
    { controllerMethod: 'EntranceController.moveToCave' },
    res,
    toEntrance
  );
};
