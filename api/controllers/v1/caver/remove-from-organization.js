const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const { caverId } = req.params;
  const { organizationId } = req.params;

  // Check if user can only modify their own membership or is admin
  const hasAdminRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.ADMINISTRATOR
  );

  if (!hasAdminRight && req.token.id !== parseInt(caverId, 10)) {
    return res.forbidden(
      'You can only manage your own organization memberships.'
    );
  }

  // Check if caver exists
  const caver = await TCaver.findOne(caverId);
  if (!caver) {
    return res.notFound(`Caver with id ${caverId} not found.`);
  }

  // Check if organization exists
  const organization = await TGrotto.findOne(organizationId);
  if (!organization) {
    return res.notFound(`Organization with id ${organizationId} not found.`);
  }

  // Check if relationship exists
  const caverWithGrottos = await TCaver.findOne(caverId).populate('grottos');
  const isMember = caverWithGrottos.grottos.some(
    (grotto) => grotto.id === parseInt(organizationId, 10)
  );

  if (!isMember) {
    return res.badRequest('Caver is not a member of this organization.');
  }

  // Remove the relationship
  await TCaver.removeFromCollection(caverId, 'grottos', organizationId);

  return res
    .status(200)
    .json({ message: 'Caver removed from organization successfully' });
};
