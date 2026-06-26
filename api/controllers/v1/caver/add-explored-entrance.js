const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const caverId = req.param('caverId');
  const entranceId = req.param('entranceId');

  const hasAdminRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.ADMINISTRATOR
  );
  const hasModeratorRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  if (
    !hasAdminRight &&
    !hasModeratorRight &&
    req.token.id !== parseInt(caverId, 10)
  ) {
    return res.forbidden('You can only manage your own explored entrances.');
  }

  const entrance = await TEntrance.findOne({ id: entranceId });
  if (!entrance || entrance.isDeleted) {
    return res.notFound(`Entrance with id ${entranceId} not found.`);
  }

  const caver = await TCaver.findOne({ id: caverId });
  if (!caver || caver.isDeleted) {
    return res.notFound(`Caver with id ${caverId} not found.`);
  }

  // Atomic upsert: INSERT with ON CONFLICT eliminates the TOCTOU race
  const insertQuery = `
    INSERT INTO j_caver_entrance_explorer (id_entrance, id_caver)
    VALUES ($1, $2)
    ON CONFLICT (id_entrance, id_caver) DO NOTHING
  `;
  const result = await sails.sendNativeQuery(insertQuery, [
    entranceId,
    caverId,
  ]);

  if (result.rowCount === 0) {
    return res.conflict(
      'Caver is already registered as an explorer of this entrance.'
    );
  }

  return res.status(204).send();
};
