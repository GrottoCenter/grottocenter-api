const ErrorService = require('../../../services/ErrorService');
const RightService = require('../../../services/RightService');

const { checkIfExists } = sails.helpers;

module.exports = async (req, res) => {
  // Check right
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to subscribe to a massif.');
  }

  // Check if massif exists
  const massifId = req.param('id');
  if (
    !(await checkIfExists.with({
      attributeName: 'id',
      attributeValue: massifId,
      sailsModel: TMassif,
    }))
  ) {
    return res.notFound({
      error: `Could not find massif with id ${massifId}.`,
    });
  }

  try {
    await TCaver.addToCollection(req.token.id, 'subscribedToMassifs', [
      massifId,
    ]);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
