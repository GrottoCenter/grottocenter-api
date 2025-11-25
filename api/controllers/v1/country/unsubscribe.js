const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const isAdmin = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  const isLeader = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );

  if (!isAdmin && !isLeader) {
    return res.forbidden(
      'You are not authorized to unsubscribe from a country.'
    );
  }

  const targetUserId = req.param('userId') || req.token.id;

  if (!isAdmin && targetUserId !== req.token.id) {
    return res.forbidden('You can only unsubscribe yourself.');
  }

  // Check if country exists
  const countryId = req.param('id');
  const country = await TCountry.findOne(countryId);
  if (!country) {
    return res.notFound({ message: `Country with id ${countryId} not found.` });
  }

  const caver = await TCaver.findOne(targetUserId).populate(
    'subscribedToCountries'
  );

  if (
    !isAdmin &&
    !caver.subscribedToCountries.find((m) => m.id === country.id)
  ) {
    return res.badRequest(
      `You are not subscribed to the country with id ${countryId} and therefore cannot be unsubscribed.`
    );
  }

  await TCaver.removeFromCollection(targetUserId, 'subscribedToCountries', [
    countryId,
  ]);
  return res.ok();
};
