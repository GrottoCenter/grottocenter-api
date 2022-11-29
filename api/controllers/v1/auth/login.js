const AuthService = require('../../../services/AuthService');
const TokenService = require('../../../services/TokenService');

module.exports = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.authenticate(email, password);
    if (result.status === AuthService.authenticateResult.MUST_RESET) {
      return res.unauthorized({
        status: 'MustReset',
        message: 'Password needs to be reset',
      });
    }

    if (result.status !== AuthService.authenticateResult.SUCCESS) {
      return res.unauthorized({
        status: 'Mismatch',
        message: 'Invalid email or password.',
      });
    }
    const token = TokenService.issue(
      {
        id: result.user.id,
        groups: result.user.groups,
        nickname: result.user.nickname,
      },
      sails.config.custom.authTokenTTL,
      'Authentication'
    );
    return res.json({ status: 'Success', token });
  } catch (err) {
    return res.serverError({ message: `Error while trying to log in: ${err}` });
  }
};
