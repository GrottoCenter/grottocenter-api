const AvatarService = require('../../../services/AvatarService');

// DELETE /api/v1/organizations/:id/avatar — idempotent: 204 whether or not
// there was one. Same rights as updating the organization.
module.exports = async (req, res) => {
  const organizationId = Number(req.param('id'));
  const organization = await TGrotto.findOne({ id: organizationId }).select([
    'isDeleted',
  ]);
  if (!organization || organization.isDeleted) {
    return res.notFound({
      message: `Organization of id ${organizationId} not found.`,
    });
  }

  try {
    await AvatarService.removeAvatar('organization', organizationId, {
      reviewer: req.token.id,
    });
    return res.ok();
  } catch (err) {
    sails.log.error(err);
    return res.serverError();
  }
};
