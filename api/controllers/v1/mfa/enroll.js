const RightService = require('../../../services/RightService');
const MfaService = require('../../../services/MfaService');

module.exports = async (req, res) => {
  // 1. Check permissions — must be an Administrator
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to perform this action.');
  }

  // 2. Load caver record to check MFA status
  const caver = await TCaver.findOne({ id: req.token.id });
  if (!caver) {
    return res.serverError('Could not find the authenticated caver record.');
  }

  // 3. Reject if MFA is already active
  if (caver.mfaEnabled === true) {
    return res.conflict('MFA is already enabled for this account.');
  }

  // 4. Start enrollment — generate and store the TOTP secret
  const { secret, otpauthUri } = await MfaService.startEnrollment(req.token.id);

  // 5. Return secret and otpauth URI
  return res.ok({ secret, otpauthUri });
};
