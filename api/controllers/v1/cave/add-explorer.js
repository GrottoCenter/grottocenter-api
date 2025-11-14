const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasAdminRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.ADMINISTRATOR
  );
  const hasModeratorRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const caveId = req.param('caveId');
  const organizationId = req.param('organizationId');

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
    return res
      .status(403)
      .json({ error: 'You are not authorized to add a cave explorer.' });
  }

  // Check if cave exists
  const cave = await TCave.findOne(caveId);
  if (!cave || cave.isDeleted) {
    return res.notFound(`Cave with id ${caveId} not found.`);
  }

  // Check if organization exists
  const organization = await TGrotto.findOne(organizationId);
  if (!organization || organization.isDeleted) {
    return res.notFound(`Organization with id ${organizationId} not found.`);
  }

  // Check if relationship already exists
  const existingQuery = `
    SELECT 1 FROM j_grotto_cave_explorer 
    WHERE id_cave = $1 AND id_grotto = $2
  `;
  const existingResult = await sails.sendNativeQuery(existingQuery, [
    caveId,
    organizationId,
  ]);

  if (existingResult.rows.length > 0) {
    return res.badRequest('Organization is already exploring this cave.');
  }

  // Create the relationship
  const insertQuery = `
    INSERT INTO j_grotto_cave_explorer (id_cave, id_grotto) 
    VALUES ($1, $2)
  `;
  await sails.sendNativeQuery(insertQuery, [caveId, organizationId]);

  return res.status(200).json({ message: 'Cave explorer added successfully.' });
};
