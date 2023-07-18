const CaveService = require('../../../services/CaveService');
const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

const { checkIfExists } = sails.helpers;

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a cave.');
  }

  // Check if cave exists and is not deleted
  const caveId = req.param('id');
  const checkIfCaveExists = async (args) =>
    // eslint-disable-next-line no-return-await
    await checkIfExists.with({
      attributeName: 'id',
      sailsModel: TCave,
      additionalAttributes: { isDeleted: false },
      ...args,
    });

  if (!(await checkIfCaveExists({ attributeValue: caveId }))) {
    return res.badRequest(`Cave with id ${caveId} not found.`);
  }

  // Merge cave with another one before deleting it
  if (req.param('destinationCaveForOrphan')) {
    const destinationCaveId = req.param('destinationCaveForOrphan');
    if (!(await checkIfCaveExists({ attributeValue: destinationCaveId }))) {
      return res.badRequest(
        `Destination cave with id ${destinationCaveId} not found.`
      );
    }

    try {
      await CaveService.mergeCaves(caveId, destinationCaveId);
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  }

  // Delete cave
  try {
    await CaveService.deleteCave(req, caveId);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
