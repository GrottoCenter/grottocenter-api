const RightService = require('../../../services/RightService');
const MassifService = require('../../../services/MassifService');
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

  try {
    // Unmark the massif as sensitive. Logic won't cascade the removal to entrances.
    await MassifService.setSensitivity(massifId, false, req.token.id);

    const updatedMassif = await MassifService.getPopulatedMassif(massifId);
    await MassifService.updateInSearch(updatedMassif);

    return ControllerService.treatAndConvert(
      req,
      null,
      updatedMassif,
      { controllerMethod: 'MassifController.unmark-sensitive' },
      res,
      toMassif
    );
  } catch (err) {
    sails.log.error(
      `Error clearing sensitive status from massif with id ${massifId}:`,
      err
    );
    return res.serverError(err);
  }
};
