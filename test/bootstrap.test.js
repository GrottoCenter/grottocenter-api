const sails = require('sails');
const Fixted = require('fixted');
const UPDATE_SEQUENCES_QUERY = require('./update_sequences');

before(function (done) {
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

    (err) => {
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
            .then(() => done())
            .catch((err) => done(err));
        },
        false,
      );
    },
  );
});

after((done) => {
  // here you can clear fixtures, etc.
  sails.lower(done);
});
