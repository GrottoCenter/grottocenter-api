const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to subscribe to a region.');
  }

  const countryId = req.param('countryId');
  const regionId = req.param('regionId');

  // Check if ISO 3166-2 region exists
  const isoCode = `${countryId}-${regionId}`;
  const region = await TISO31662.findOne({ id: isoCode });
  if (!region) {
    return res.notFound({ message: `Region ${isoCode} not found.` });
  }

  // Check if subscription already exists
  const caver = await TCaver.findOne({ id: req.token.id }).populate(
    'subscribedToRegions'
  );

  const isAlreadySubscribed = caver.subscribedToRegions.some(
    (r) => r.id === isoCode
  );

  if (isAlreadySubscribed) {
    return res.ok({ message: 'Already subscribed to this region.' });
  }

  await TCaver.addToCollection(req.token.id, 'subscribedToRegions', [isoCode]);
  return res.ok();
};
