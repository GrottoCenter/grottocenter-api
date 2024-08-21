const CaveService = require('../../../services/CaveService');
const ControllerService = require('../../../services/ControllerService');
const { toEntrance } = require('../../../services/mapping/converters');

const { checkIfExists } = sails.helpers;

module.exports = async (req, res) => {
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

  // Remove entrance from initial cave and possibly delete initial cave
  const entrance = await TEntrance.findOne(entranceId);

  if (entrance.cave) {
    await TCave.removeFromCollection(entrance.cave, 'entrances', [entranceId]);
    const initialCave = await TCave.findOne(entrance.cave).populate(
      'entrances'
    );

    if (initialCave.entrances.length === 0) {
      await TCave.update(initialCave.id).set({ redirectTo: destinationCaveId });
      await CaveService.deleteCave(req, initialCave.id);
    }
  }

  // Add entrance to destination cave
  await TCave.addToCollection(destinationCaveId, 'entrances', [entranceId]);

  // Return populated entrance
  const updatedEntrance = await TEntrance.findOne(entranceId).populate('cave');
  updatedEntrance.cave.entrances = await TEntrance.find({
    cave: destinationCaveId,
  });

  return ControllerService.treatAndConvert(
    req,
    null,
    updatedEntrance,
    { controllerMethod: 'EntranceController.moveToCave' },
    res,
    toEntrance
  );
};
