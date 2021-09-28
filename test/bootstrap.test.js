let sails = require('sails');
const Fixted = require('fixted');

before(function(done) {
  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(5000);

  sails.lift(
    {
      log: {
        level: 'silly',
      },
      models: {
        connection: 'test',
        migrate: 'drop',
      },
      csrf: false,
    },

    function(err) {
      if (err) return done(err);
      // Here you can load fixtures, etc.
      const fixted = new Fixted();
      fixted.populate(function(err) {
        if (err) {
          return done(err);
        }
        // Do your thing...
        done();
      });
    },
  );
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(done);
});
