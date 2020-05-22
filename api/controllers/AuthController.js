/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  login: (req, res) => {
    passport.authenticate('local', (err, user) => {
      if (!err && !user) {
        return res.unauthorized({ message: 'Invalid email or password.' });
      }
      if (err) {
        sails.log.error('Error while trying to log in: ' + err);
        return res
          .status(500)
          .send({ message: 'An internal server error occurred.' });
      }
      req.logIn(user, (err) => {
        if (err) return res.json({ message: err });
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
