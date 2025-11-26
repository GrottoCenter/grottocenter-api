const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const caverId = req.param('caverId');
  const caveId = req.param('caveId');

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
    return res.forbidden('You can only manage your own explored caves.');
  }

  const cave = await TCave.findOne({ id: caveId });
  if (!cave || cave.isDeleted) {
    return res.notFound(`Cave with id ${caveId} not found.`);
  }

  const caver = await TCaver.findOne({ id: caverId });
  if (!caver || caver.isDeleted) {
    return res.notFound(`Caver with id ${caverId} not found.`);
  }

  // Check if a relationship exists
  const existingQuery = `
    SELECT 1 FROM j_caver_cave_explorer
    WHERE id_cave = $1 AND id_caver = $2
  `;
  const existingResult = await sails.sendNativeQuery(existingQuery, [
    caveId,
    caverId,
  ]);

  if (existingResult.rows.length === 0) {
    return res.badRequest('Caver is not exploring this cave.');
  }

  // Remove the relationship
  const deleteQuery = `
    DELETE FROM j_caver_cave_explorer
    WHERE id_cave = $1 AND id_caver = $2
  `;
  await sails.sendNativeQuery(deleteQuery, [caveId, caverId]);
  return res.status(204).send();
};
