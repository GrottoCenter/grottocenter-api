const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const organizationId = req.param('organizationId');
  const caveId = req.param('caveId');

  const hasAdminRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.ADMINISTRATOR
  );
  const hasModeratorRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  // Check if user is member of the organization
  const memberQuery = `
    SELECT 1 FROM j_grotto_caver
    WHERE id_caver = $1 AND id_grotto = $2
  `;
  const memberResult = await sails.sendNativeQuery(memberQuery, [
    req.token.id,
    organizationId,
  ]);
  const isMember = memberResult.rows.length > 0;

  if (!hasAdminRight && !hasModeratorRight && !isMember) {
    return res.forbidden('You are not authorized to remove a cave explorer.');
  }

  const cave = await TCave.findOne({ id: caveId });
  if (!cave || cave.isDeleted) {
    return res.notFound(`Cave with id ${caveId} not found.`);
  }

  const organization = await TGrotto.findOne({ id: organizationId });
  if (!organization || organization.isDeleted) {
    return res.notFound(`Organization with id ${organizationId} not found.`);
  }

  // Check if a relationship exists
  const existingQuery = `
    SELECT 1 FROM j_grotto_cave_explorer
    WHERE id_cave = $1 AND id_grotto = $2
  `;
  const existingResult = await sails.sendNativeQuery(existingQuery, [
    caveId,
    organizationId,
  ]);

  if (existingResult.rows.length === 0) {
    return res.badRequest('Organization is not exploring this cave.');
  }

  // Remove the relationship
  const deleteQuery = `
    DELETE FROM j_grotto_cave_explorer
    WHERE id_cave = $1 AND id_grotto = $2
  `;
  await sails.sendNativeQuery(deleteQuery, [caveId, organizationId]);

  return res.status(204).send();
};
