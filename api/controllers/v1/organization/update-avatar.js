const AvatarService = require('../../../services/AvatarService');

// PUT /api/v1/organizations/:id/avatar — multipart upload, image in the
// `file` field. Same rights as updating the organization.
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

  const file = req.files?.file?.[0];
  const uploadError = AvatarService.validateUpload(file);
  if (uploadError) {
    return res.badRequest(uploadError);
  }

  try {
    const avatarPath = await AvatarService.setAvatar(
      'organization',
      organizationId,
      file.buffer,
      { reviewer: req.token.id }
    );
    return res.ok({ avatarUrl: AvatarService.getUrl(avatarPath) });
  } catch (err) {
    if (err.code === AvatarService.INVALID_IMAGE) {
      return res.badRequest(err.message);
    }
    sails.log.error(err);
    return res.serverError();
  }
};
