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

  // Check if a relationship exists
  const existingQuery = `
    SELECT 1 FROM j_caver_entrance_explorer
    WHERE id_entrance = $1 AND id_caver = $2
  `;
  const existingResult = await sails.sendNativeQuery(existingQuery, [
    entranceId,
    caverId,
  ]);

  if (existingResult.rows.length === 0) {
    return res.notFound(
      'Caver is not registered as an explorer of this entrance.'
    );
  }

  // Remove the relationship
  const deleteQuery = `
    DELETE FROM j_caver_entrance_explorer
    WHERE id_entrance = $1 AND id_caver = $2
  `;
  await sails.sendNativeQuery(deleteQuery, [entranceId, caverId]);
  return res.status(204).send();
};
