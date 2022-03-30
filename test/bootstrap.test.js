let sails = require('sails');
const UPDATE_SEQUENCES_QUERY = require('./update_sequences');
const Fixted = require('fixted');

before(function(done) {
  this.timeout(20000);

  sails.lift(
    {
      log: {
        level: 'silly',
      },
      datastores: {
        default: {
          adapter: require('sails-postgresql'),
          url: 'postgres://root:root@localhost:5432/grottoce',
        },
      },
      models: {
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
          'tfileformat',
          'tlicense',
          'toption',
          'tcomment',
          'tfile',
        ],
        (err) => {
          if (err) {
            return done(err);
          }
          CommonService.query(UPDATE_SEQUENCES_QUERY)
            .then(() => {
              return done();
            })
            .catch((err) => {
              return done(err);
            });
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
