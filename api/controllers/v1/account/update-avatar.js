const AvatarService = require('../../../services/AvatarService');

// PUT /api/v1/account/avatar — multipart upload, image in the `file` field
module.exports = async (req, res) => {
  const file = req.files?.file?.[0];
  const uploadError = AvatarService.validateUpload(file);
  if (uploadError) {
    return res.badRequest(uploadError);
  }

  try {
    const avatarPath = await AvatarService.setAvatar(
      'caver',
      req.token.id,
      file.buffer
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
