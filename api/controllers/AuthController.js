/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
'use strict';
module.exports = {
  /*login: function(req, res) {
      passport.authenticate('local', function(err, user, info) {
          if ((err) || (!user)) {
              sails.log.error(err);
              req.session.flash = {
                  err: err
              }
              return res.redirect("/ui/login");
          }
          req.logIn(user, function(err) {
              if (err) res.send(err);
      req.session.authenticated = true;
              return res.redirect("/");
          });
      })(req, res);
  },*/

  login: function(req, res) {
    const contact = req.body.contact;
    const password = req.body.password;

    if (!contact || !password) {
      return res.unauthorized(res.i18n('BAD_CREDENTIAL'));
    }

    TCaver.findOne({
      contact: contact
    }, function(err, account) {
      if (!account) {
        return res.unauthorized('Bad credentials.');
      }

      TCaver.comparePassword(password, account, function(err, valid) {
        if (err || !valid) {
          return res.unauthorized('Bad credentials.');
        }

        req.session.authenticated = true;
        res.json({
          user: account,
          token: TokenAuthService.issue({
            id: account.id
          })
        });
      });
    });
  },

  logout: function(req, res) {
    return res.badRequest('AuthController.logout not yet implemented!');
    /*req.session.authenticated = false;
    return res.json(200, {"Logout succeeded"});*/
  }
};
