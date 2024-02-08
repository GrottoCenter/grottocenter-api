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
    return res.forbidden('You are not authorized to unsubscribe to a country.');
  }

  // Check if country exists
  const countryId = req.param('id');
  if (
    !(await checkIfExists.with({
      attributeName: 'id',
      attributeValue: countryId,
      sailsModel: TCountry,
    }))
  ) {
    return res.notFound({
      error: `Could not find country with id ${countryId}.`,
    });
  }

  try {
    const caver = await TCaver.findOne(req.token.id).populate(
      'subscribedToCountries'
    );
    if (!caver.subscribedToCountries.find((m) => m.id === countryId)) {
      return res.unprocessable(
        `You are not subscribed to the country with id ${countryId} and therefore cannot be unsubscribed.`
      );
    }

    await TCaver.removeFromCollection(req.token.id, 'subscribedToCountries', [
      countryId,
    ]);
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
