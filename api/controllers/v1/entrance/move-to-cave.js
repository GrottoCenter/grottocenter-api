const ControllerService = require('../../../services/ControllerService');
const EntranceService = require('../../../services/EntranceService');
const { toEntrance } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  // Remove entrance from initial cave and possibly delete initial cave

  const entranceId = req.param('entranceId');
  const entrance = await TEntrance.findOne(entranceId);
  if (!entrance || entrance.isDeleted) {
    return res.notFound({ message: `Entrance of id ${entranceId} not found.` });
  }

  const destinationCaveId = req.param('caveId');
  const destinationCave = await TCave.findOne(destinationCaveId);
  if (!destinationCave || destinationCave.isDeleted) {
    return res.notFound({
      message: `Cave of id ${destinationCaveId} not found.`,
    });
  }

  await TCave.removeFromCollection(entrance.cave, 'entrances', [entranceId]);

  const initialCave = await TCave.findOne(entrance.cave).populate('entrances');

  if (initialCave.entrances.length === 0) {
    await TCave.update(initialCave.id).set({ redirectTo: destinationCaveId });
    await TCave.destroyOne({ id: initialCave.id }); // Soft delete
  }

  // Add entrance to destination cave
  await TCave.addToCollection(destinationCaveId, 'entrances', [entranceId]);

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
