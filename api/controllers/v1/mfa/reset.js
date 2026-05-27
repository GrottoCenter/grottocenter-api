const RightService = require('../../../services/RightService');
const AuthService = require('../../../services/AuthService');
const MfaService = require('../../../services/MfaService');
const ControllerService = require('../../../services/ControllerService');

module.exports = async (req, res) => {
  // 1. Check permissions — must be an Administrator
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to perform this action.');
  }

  // 2. Require password re-entry to prevent stolen-token abuse.
  // If an attacker steals a JWT, they cannot reset MFA without knowing
  // the account password.
  const { password } = req.body || {};
  if (!password) {
    return res.badRequest('Password is required to reset MFA.');
  }

  const caver = await TCaver.findOne({ id: req.token.id });
  if (!caver) {
    return res.notFound('Account not found.');
  }

  const authResult = await AuthService.authenticate(caver.mail, password);
  if (authResult.status !== AuthService.authenticateResult.SUCCESS) {
    return res.unauthorized({
      status: 'Mismatch',
      message: 'Invalid password.',
    });
  }

  // 3. Reset MFA — clear TOTP secret and deactivate
  await MfaService.resetMfa(req.token.id);

  // 4. Return success
  return ControllerService.treat(
    req,
    null,
    {
      status: 'Success',
      message:
        'MFA has been reset. You will need to re-enroll on your next login.',
    },
    { controllerMethod: 'MfaController.reset' },
    res
  );
};
