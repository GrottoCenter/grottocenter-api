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
    return res.forbidden('You are not authorized to unsubscribe to a massif.');
  }

  // Check if massif exists
  const massifId = Number(req.param('id'));
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
    const caver = await TCaver.findOne(req.token.id).populate(
      'subscribedToMassifs'
    );
    if (!caver.subscribedToMassifs.find((m) => m.id === massifId)) {
      return res.unprocessable(
        `You are not subscribed to the massif with id ${massifId} and therefore cannot be unsubscribed.`
      );
    }

    await TCaver.removeFromCollection(req.token.id, 'subscribedToMassifs', [
      massifId,
    ]);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
