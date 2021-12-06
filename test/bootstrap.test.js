let sails = require('sails');
const Fixted = require('fixted');

before(function(done) {
  this.timeout(10000);

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
      fixted.populate(
        [
          'tlanguage',
          'tright',
          'tidentifiertype',
          'tsubject',
          'ttype',
          'tgroup',
          'tcaver',
          'tname',
          'tgrotto',
          'tdocument',
          'tdescription',
          'tcave',
          'tentrance',
          'tmassif',
          'thistory',
        ],
        function(err) {
          if (err) {
            return done(err);
          }
          // Do your thing...
          done();
        },
        false,
      );
    },
  );
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(done);
});
