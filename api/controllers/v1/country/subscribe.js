const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to subscribe to a country.');
  }

  // Check if country exists
  const countryId = req.param('id');
  const country = await TCountry.findOne(countryId);
  if (!country) {
    return res.notFound({ message: `Country with id ${countryId} not found.` });
  }

  // Check if subscription already exists
  const caver = await TCaver.findOne({ id: req.token.id }).populate(
    'subscribedToCountries'
  );

  const isAlreadySubscribed = caver.subscribedToCountries.some(
    (c) => c.id === countryId
  );

  if (isAlreadySubscribed) {
    return res.ok({ message: 'Already subscribed to this country.' });
  }

  await TCaver.addToCollection(req.token.id, 'subscribedToCountries', [
    countryId,
  ]);
  return res.ok();
};
