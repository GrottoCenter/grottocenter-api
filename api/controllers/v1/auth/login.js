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
      sails.log.error(`Error while trying to log in: ${err}`);
      return res
        .status(500)
        .send({ message: 'An internal server error occurred.' });
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
