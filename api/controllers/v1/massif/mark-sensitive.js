const RightService = require('../../../services/RightService');
const MassifService = require('../../../services/MassifService');
const EntranceService = require('../../../services/EntranceService');
const ControllerService = require('../../../services/ControllerService');
const { toMassif } = require('../../../services/mapping/converters');

module.exports = async (req, res) => {
  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  if (!isAdmin) {
    return res.forbidden('Only administrators can perform this action.');
  }

  const massifId = req.param('id');
  if (!massifId) {
    return res.badRequest('massifId is required.');
  }

  const massif = await TMassif.findOne(massifId);
  if (!massif || massif.isDeleted) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  // Idempotency: skip if already sensitive
  if (massif.isSensitive) {
    const updatedMassif = await MassifService.getPopulatedMassif(massifId);
    return ControllerService.treat(
      req,
      null,
      {
        count: 0,
        massif: toMassif(updatedMassif),
      },
      { controllerMethod: 'MassifController.mark-sensitive' },
      res
    );
  }

  try {
    // Set the massif as sensitive and get IDs of entrances that were updated
    const updatedEntranceIds = await MassifService.setSensitivity(
      massifId,
      true,
      req.token.id
    );

    // Update search index for each affected entrance
    await Promise.all(
      updatedEntranceIds.map(async (id) => {
        const populatedEntrance =
          await EntranceService.getPopulatedEntrance(id);
        if (populatedEntrance) {
          await EntranceService.updateInSearch(populatedEntrance);
        }
      })
    );

    const updatedMassif = await MassifService.getPopulatedMassif(massifId);
    await MassifService.updateInSearch(updatedMassif);

    return ControllerService.treat(
      req,
      null,
      {
        count: updatedEntranceIds.length,
        massif: toMassif(updatedMassif),
      },
      { controllerMethod: 'MassifController.mark-sensitive' },
      res
    );
  } catch (err) {
    sails.log.error(
      `Error setting massif with id ${massifId} as sensitive:`,
      err
    );
    return res.serverError(err);
  }
};
