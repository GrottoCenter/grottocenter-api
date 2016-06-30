/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var passport = require('passport');
module.exports = {

	login : function (req, res) {
        if (req.session.authenticated == true) {
            res.redirect("/caver/");
            return;
        }
        res.view();
    },

    validate: function(req, res){
        passport.authenticate('local', function(err, user, info) {
            if ((err) || (!user)) {
                sails.log.error(err); 
                req.session.flash = {
                    err: err
                }
                return res.redirect("/auth/login");
            }
            req.logIn(user, function(err) {
                if (err) res.send(err);
				req.session.authenticated = true;
                return res.redirect("/");
            });
        })(req, res);
    },

    logout : function (req, res) {
        req.session.authenticated = false;
        res.redirect("/");
    }
};
