var passport    = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

// helper functions
function findById(id, fn) {
  Caver.findOne(id).exec( function(err, user){
    if (err){
      return fn(null, null);
    }else{
      return fn(null, user);
    }
  });
}

function findByEmail(e, fn) {
  Caver.findOne({
    Contact: e
  }).exec(function(err, user) {
    // Error handling
    if (err) {
      return fn(null, null);
    // The User was found successfully!
    }else{
      return fn(null, user);
    }
  });
}

function md5(string) {
  var crypto = require('crypto');
  return crypto.createHash('md5').update(string).digest('hex');
}

function getOldGCpassword(login, password) {
  return addslashes(md5(login + "*" + password));
}

function addslashes(str) {
  // From: http://phpjs.org/functions
  // *     example 1: addslashes("kevin's birthday");
  // *     returns 1: 'kevin\'s birthday'
  return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function(sessionUser, done) {
  done(null, sessionUser.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a email and password), and invoke a callback
// with a user object.
passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  function(email, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // Find the user by email. If there is no user with the given
      // email, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message. Otherwise, return the
      // authenticated `user`.
      findByEmail(email, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: 'Unknown user ' + email });
        }
        var hash = getOldGCpassword(user.Login, password);
        if (hash.localeCompare(user.Password) == 0) {
          var returnUser = { email: user.Contact, createdAt: user.Date_inscription, id: user.Id };
          return done(null, returnUser, { message: 'Logged In Successfully'} );
        } else {
          return done(null, false, { message: 'Invalid Password'});
        }
      })
    });
  }
));
