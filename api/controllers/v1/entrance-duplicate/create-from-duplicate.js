const EntranceService = require('../../../services/EntranceService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to create an entrance duplicate.'
    );
  }

  const id = req.param('id');
  const entranceDuplicate = await TEntranceDuplicate.findOne({ id });
  if (!entranceDuplicate) {
    return res.badRequest(`Could not find duplicate with id ${id}.`);
  }

  // The parked content was frozen at import time and carries the import's
  // creation dates: the entrance is only created now, so stamp it now (#1802).
  const now = new Date();
  const { entrance, nameDescLoc = {} } = entranceDuplicate.content;
  const stamp = (data) => data && { ...data, dateInscription: now };

  const created = await EntranceService.createEntrance(req, stamp(entrance), {
    ...nameDescLoc,
    name: stamp(nameDescLoc.name),
    description: stamp(nameDescLoc.description),
    location: stamp(nameDescLoc.location),
  });
  await TEntranceDuplicate.destroyOne(id);
  sails.log.info(
    `Entrance duplicate ${id} → entrance ${created?.id} by caver ${req.token.id}`
  );

  return res.ok();
};
