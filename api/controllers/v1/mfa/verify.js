const TokenService = require('../../../services/TokenService');
const MfaService = require('../../../services/MfaService');

module.exports = async (req, res) => {
  const { totpCode } = req.body;

  // Validate format: must be a 6-digit numeric string
  if (!totpCode || !/^\d{6}$/.test(totpCode)) {
    return res.badRequest({
      message: 'totpCode must be a 6-digit numeric string.',
    });
  }

  // Confirm enrollment with the provided TOTP code
  const result = await MfaService.confirmEnrollment(req.token.id, totpCode);

  if (!result.success) {
    return res.unauthorized({
      status: 'InvalidTotpCode',
      message: result.error,
    });
  }

  // Issue a full Auth_Token with admin TTL
  const caver = await TCaver.findOne({ id: req.token.id }).populate('groups');
  const tokenTTL =
    sails.config.custom.adminAuthTokenTTL || sails.config.custom.authTokenTTL;

  const token = TokenService.issue(
    {
      id: caver.id,
      groups: caver.groups,
      nickname: caver.nickname,
    },
    tokenTTL,
    'Authentication'
  );

  return res.json({ status: 'Success', token });
};
