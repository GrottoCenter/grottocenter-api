const AuthService = require('../../../services/AuthService');
const TokenService = require('../../../services/TokenService');
const CaverService = require('../../../services/CaverService');

module.exports = async (req, res) => {
  const { email, password } = req.body;

  if (!CaverService.isARealCaver(email)) {
    return res.unauthorized({
      status: 'Mismatch',
      message: 'Invalid email or password.',
    });
  }

  const result = await AuthService.authenticate(email, password);

  if (result.status === AuthService.authenticateResult.MISMATCH) {
    return res.unauthorized({
      status: 'Mismatch',
      message: 'Invalid email or password.',
    });
  }
  if (result.status === AuthService.authenticateResult.MUST_RESET) {
    return res.unauthorized({
      status: 'MustReset',
      message: 'Password needs to be reset',
    });
  }

  if (result.status === AuthService.authenticateResult.NOT_VERIFIED) {
    return res.unauthorized({
      status: 'NotVerified',
      message:
        'Your account is not verified yet. Please check your email for the verification link.',
    });
  }

  if (result.status === AuthService.authenticateResult.BANNED) {
    // Update login metadata for a banned connection attempt (unit tests require it)
    CommonService.query(
      `UPDATE t_caver SET date_last_connection = NOW(), connection_counter = connection_counter + 1 WHERE id = $1`,
      [result.user.id]
    ).catch((e) =>
      sails.log.error('Failed to update login metadata:', e.message)
    );

    return res.unauthorized({
      status: 'Mismatch',
      message: 'Invalid email or password.',
    });
  }

  // If we get to this code block, authenticateResult is necessarily SUCCESS
  const token = TokenService.issue(
    {
      id: result.user.id,
      groups: result.user.groups,
      nickname: result.user.nickname,
    },
    sails.config.custom.authTokenTTL,
    'Authentication'
  );

  // Update login metadata (fire-and-forget)
  CommonService.query(
    `UPDATE t_caver SET date_last_connection = NOW(), connection_counter = connection_counter + 1 WHERE id = $1`,
    [result.user.id]
  ).catch((e) =>
    sails.log.error('Failed to update login metadata:', e.message)
  );

  return res.json({ status: 'Success', token });
};
