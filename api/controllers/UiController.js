/**
 * UiController
 *
 * @description :: Server-side logic for managing the user interface of GC3
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  index: function(req, res) {
    return res.view();
  },

  /*login: function(req, res) {
    if (req.session.authenticated == true) {
      res.redirect('/ui/');
      return;
    }
    res.view();
  },*/

  login: function(req, res) {
    console.log('login req.body : ' + req.body.contact);

    req.post('/auth/login', req.body, function(data) {
      console.log('login result data : ' + data);
    });

    res.redirect('/');
  },

  cavelist: function(req, res) {
    return res.view();
  },

  entryList: function(req, res) {
    return res.view();
  }
};
