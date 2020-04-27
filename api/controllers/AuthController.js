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

    return TCaver.findOne({ contact }).exec((err, account) => {
      if (!account || err) {
        return res.unauthorized('Bad credentials.');
      }
      const accountObj = { ...account }; // account is a RowDataPacket => cast it to JS Object

      return TCaver.comparePassword(password, accountObj, (err2, valid) => {
        if (err2 || !valid) {
          return res.unauthorized('Bad credentials.');
        }

        req.session.authenticated = true;
        const token = TokenAuthService.issue({
          id: accountObj.id,
        });

        return res.json({
          user: accountObj,
          token,
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
