/**
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');

function find(sessionUser, fn) {
  TCaver.findById(sessionUser.id, (err, user) => {
    if (err) {
      return fn(null, null);
    }
    return fn(null, user);
  });
}

function md5(string) {
  return crypto
    .createHash('md5')
    .update(string)
    .digest('hex');
}

function addslashes(str) {
  // From: http://phpjs.org/functions
  // *     example 1: addslashes("kevin's birthday");
  // *     returns 1: 'kevin\'s birthday'
  // eslint-disable-next-line no-control-regex
  return `${str}`.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

function getOldGCpassword(login, password) {
  return addslashes(md5(`${login}*${password}`));
}

function verifyPassword(user, password) {
  const hash = getOldGCpassword(user.Login, password);
  return user.password === password || user.password === hash;
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  find(user, (err, cbUser) => {
    done(err, cbUser);
  });
});

passport.use(
  new LocalStrategy(
    {
      usernameField: 'contact',
    },
    (username, password, done) => {
      TCaver.findOne(
        {
          contact: username,
        },
        (err, user) => {
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
        },
      );
    },
  ),
);
