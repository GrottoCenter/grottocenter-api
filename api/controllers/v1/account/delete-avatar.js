const AvatarService = require('../../../services/AvatarService');

// DELETE /api/v1/account/avatar — idempotent: 204 whether or not there was one
module.exports = async (req, res) => {
  try {
    await AvatarService.removeAvatar('caver', req.token.id);
    return res.ok();
  } catch (err) {
    sails.log.error(err);
    return res.serverError();
  }
};
