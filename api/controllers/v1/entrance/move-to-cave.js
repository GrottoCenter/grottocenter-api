const ControllerService = require('../../../services/ControllerService');
const CaveLifecycleService = require('../../../services/CaveLifecycleService');
const EntranceService = require('../../../services/EntranceService');
const { toEntrance } = require('../../../services/mapping/converters');
const isValidId = require('../../../utils/isValidId');

module.exports = async (req, res) => {
  const entranceId = Number(req.param('entranceId'));
  const destinationCaveId = Number(req.param('caveId'));
  if (!isValidId(entranceId)) {
    return res.notFound({
      message: `Entrance of id ${req.param('entranceId')} not found.`,
    });
  }
  if (!isValidId(destinationCaveId)) {
    return res.notFound({
      message: `Cave of id ${req.param('caveId')} not found.`,
    });
  }

  // The move, the transfer of the scientific data of an emptied cave and its
  // soft delete run in one transaction (#1982).
  const { notFound } = await CaveLifecycleService.moveEntranceToCave(
    entranceId,
    destinationCaveId,
    req.token.id
  );
  if (notFound) return res.notFound({ message: notFound });

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
