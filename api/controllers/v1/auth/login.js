const passport = require('passport');
const AuthService = require('../../../services/AuthService');
const TokenService = require('../../../services/TokenService');

const { tokenSalt } = AuthService;

module.exports = (req, res) => {
  // eslint-disable-next-line consistent-return
  passport.authenticate('local', (err, user) => {
    if (!err && !user) {
      return res.unauthorized({ message: 'Invalid email or password.' });
    }
    if (err) {
      return res.serverError({
        message: `Error while trying to log in: ${err}`,
      });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) return res.json({ message: loginErr });
      req.session.authenticated = true;
      const token = TokenService.issue(
        {
          id: user.id,
          groups: user.groups,
          nickname: user.nickname,
        },
        sails.config.custom.authTokenTTL,
        'Authentication',
        tokenSalt
      );
      return res.json({ token });
    });
  })(req, res);
};
