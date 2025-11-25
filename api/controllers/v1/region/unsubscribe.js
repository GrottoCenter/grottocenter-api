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
      'You are not authorized to unsubscribe from a region.'
    );
  }

  const targetUserId = req.param('userId') || req.token.id;

  if (!isAdmin && targetUserId !== req.token.id) {
    return res.forbidden('You can only unsubscribe yourself.');
  }

  const countryId = req.param('countryId');
  const regionId = req.param('regionId');

  // Check if ISO 3166-2 region exists
  const isoCode = `${countryId}-${regionId}`;
  const region = await TISO31662.findOne({ id: isoCode });
  if (!region) {
    return res.notFound({ message: `Region ${isoCode} not found.` });
  }

  const caver = await TCaver.findOne(targetUserId).populate(
    'subscribedToRegions'
  );

  if (!isAdmin && !caver.subscribedToRegions.find((r) => r.id === region.id)) {
    return res.badRequest(
      `You are not subscribed to the region with id ${regionId} and therefore cannot be unsubscribed.`
    );
  }

  await TCaver.removeFromCollection(targetUserId, 'subscribedToRegions', [
    isoCode,
  ]);
  return res.ok();
};
