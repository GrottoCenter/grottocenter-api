const RightService = require('../../../services/RightService');
const isValidId = require('../../../utils/isValidId');

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

  // userId comes from the query string: compare it as a number with token.id
  const rawUserId = req.param('userId');
  const targetUserId =
    rawUserId === undefined ? req.token.id : Number(rawUserId);
  if (!isValidId(targetUserId)) {
    return res.badRequest('userId must be a positive integer.');
  }

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
