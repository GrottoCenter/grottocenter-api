const passport = require('passport');
module.exports = {
  express: {
    customMiddleware: function(app) {
      app.use(passport.initialize());
      app.use(passport.session());
    }
  }
};
