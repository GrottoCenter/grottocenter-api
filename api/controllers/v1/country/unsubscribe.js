const RightService = require('../../../services/RightService');

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
  const country = await TCountry.findOne(countryId);
  if (!country) {
    return res.notFound({ message: `Country with id ${countryId} not found.` });
  }

  const caver = await TCaver.findOne(req.token.id).populate(
    'subscribedToCountries'
  );
  if (!caver.subscribedToCountries.find((m) => m.id === country.id)) {
    return res.badRequest(
      `You are not subscribed to the country with id ${countryId} and therefore cannot be unsubscribed.`
    );
  }

  await TCaver.removeFromCollection(req.token.id, 'subscribedToCountries', [
    countryId,
  ]);
  return res.ok();
};
