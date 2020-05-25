/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  login: (req, res) => {
    const { contact, password } = req.body;

    if (!contact || !password) {
      return res.unauthorized(res.i18n('BAD_CREDENTIAL'));
    }

    return TCaver.findOne({ contact }, (err, account) => {
      if (!account) {
        return res.unauthorized('Bad credentials.');
      }

      return TCaver.comparePassword(password, account, (err2, valid) => {
        if (err2 || !valid) {
          return res.unauthorized('Bad credentials.');
        }

        req.session.authenticated = true;
        return res.json({
          user: account,
          token: TokenAuthService.issue({
            id: account.id,
          }),
        });
      });
    });
  },

  logout: (req, res) => {
    return res.badRequest('AuthController.logout not yet implemented!');
    // req.session.authenticated = false;
    // return res.json(200, {"Logout succeeded"});
  },
};
