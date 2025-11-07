const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  // Check right
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.LEADER
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to unsubscribe from a region.'
    );
  }

  const countryId = req.param('countryId');
  const regionId = req.param('regionId');

  // Check if ISO 3166-2 region exists
  const isoCode = `${countryId}-${regionId}`;
  const region = await TISO31662.findOne({ id: isoCode });
  if (!region) {
    return res.notFound({ message: `Region ${isoCode} not found.` });
  }

  const caver = await TCaver.findOne(req.token.id).populate(
    'subscribedToRegions'
  );
  if (!caver.subscribedToRegions.find((r) => r.id === region.id)) {
    return res.badRequest(
      `You are not subscribed to the region with id ${regionId} and therefore cannot be unsubscribed.`
    );
  }

  await TCaver.removeFromCollection(req.token.id, 'subscribedToRegions', [
    isoCode,
  ]);
  return res.ok();
};
