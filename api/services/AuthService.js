'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

function find(sessionUser, fn) {
  TCaver.findById(sessionUser.id, function(err, user) {
    if (err) {
      return fn(null, null);
    } else {
      return fn(null, user);
    }
  });
}

function md5(string) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(string).digest('hex');
}

function addslashes(str) {
  // From: http://phpjs.org/functions
  // *     example 1: addslashes("kevin's birthday");
  // *     returns 1: 'kevin\'s birthday'
  return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

function getOldGCpassword(login, password) {
  return addslashes(md5(login + '*' + password));
}

function verifyPassword(user, password) {
  let hash = getOldGCpassword(user.Login, password);
  console.log(hash);

  return (user.password === password);
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  find(user, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  {
    usernameField: 'contact'
  },
  function(username, password, done) {
    TCaver.findOne({
      contact: username
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false);
      }
      if (!verifyPassword(user, password)) {
        return done(null, false);
      }
      return done(null, user);
    });
  }
));
