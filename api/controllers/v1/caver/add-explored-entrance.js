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

  // Check if a relationship already exists
  const existingQuery = `
    SELECT 1 FROM j_caver_entrance_explorer
    WHERE id_entrance = $1 AND id_caver = $2
  `;
  const existingResult = await sails.sendNativeQuery(existingQuery, [
    entranceId,
    caverId,
  ]);

  if (existingResult.rows.length > 0) {
    return res.conflict(
      'Caver is already registered as an explorer of this entrance.'
    );
  }

  // Create the relationship
  const insertQuery = `
    INSERT INTO j_caver_entrance_explorer (id_entrance, id_caver)
    VALUES ($1, $2)
  `;
  await sails.sendNativeQuery(insertQuery, [entranceId, caverId]);

  return res.status(204).send();
};
