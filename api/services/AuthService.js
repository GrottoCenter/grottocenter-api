/**
 */
const tokenSalt = process.env.TOKEN_SALT
  ? process.env.TOKEN_SALT
  : 'aR4nd0mT0kenSalt';
module.exports.tokenSalt = tokenSalt;

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');

function findCaver(sessionUser, fn) {
  TCaver.findOne(sessionUser.id).exec((err, user) => {
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

/**
 * GC3 hashing password algorithm
 * @param {String} password
 */
const createHashedPassword = (password) => {
  const hash = crypto.createHmac('sha256', tokenSalt);
  hash.update(password);
  const value = hash.digest('hex');
  return value;
};
module.exports.createHashedPassword = createHashedPassword;

/**
 * GC2 hashing password algorithm (only used for old accounts)
 * @param {String} login
 * @param {String} password
 */
function getOldGCpassword(login, password) {
  return addslashes(md5(`${login}*${password}`));
}

function verifyPassword(user, password) {
  const oldHash = getOldGCpassword(user.login, password);
  const newHash = createHashedPassword(password);
  return (
    user.password === password ||
    user.password === oldHash ||
    user.password === newHash
  );
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  findCaver(user, (err, cbUser) => {
    done(err, cbUser);
  });
});

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email', // which property to search on the JSON login request?
    },
    (email, password, done) => {
      TCaver.findOne({
        mail: email,
      })
        .populate('groups')
        .exec((err, user) => {
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
    },
  ),
);
