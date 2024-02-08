const sails = require('sails');
const Fixted = require('fixted');
const sailsPostGreAdapter = require('sails-postgresql');
const ALTER_GEOGRAPHY_QUERY = require('./alter_geography');
const UPDATE_SEQUENCES_QUERY = require('./update_sequences');
const CommonService = require('../api/services/CommonService');

// this.timeout() is not accessible with an arrow function
// eslint-disable-next-line func-names
before(function (done) {
  this.timeout(20000);

  sails.lift(
    {
      log: {
        // level: 'silly', // Enable for test debugging
      },
      datastores: {
        default: {
          adapter: sailsPostGreAdapter,
          url:
            process.env.POSTGRE_TEST_URL ??
            'postgres://root:root@localhost:5432/grottoce',
        },
      },
      models: {
        migrate: 'drop',
      },
      csrf: false,
    },

    // eslint-disable-next-line consistent-return
    (err) => {
      if (err) return done(err);
      // Here you can load fixtures, etc.
      const fixted = new Fixted();
      fixted.populate(
        [
          'tlanguage',
          'tidentifiertype',
          'tsubject',
          'ttype',
          'tcountry',
          'tgroup',
          'tnotificationtype',
          'tcaver',
          'tname',
          'tgrotto',
          'tdocument',
          'tdescription',
          'tlocation',
          'tcave',
          'tentrance',
          'tmassif',
          'thistory',
          'tfileformat',
          'tlicense',
          'toption',
          'tcomment',
          'tfile',
          'trigging',
          'tnotification',
          'hlocation',
          'hdescription',
          'hentrance',
        ],
        // eslint-disable-next-line consistent-return
        (fixtedError) => {
          if (fixtedError) {
            return done(fixtedError);
          }
          CommonService.query(UPDATE_SEQUENCES_QUERY)
            .then(() => {
              CommonService.query(ALTER_GEOGRAPHY_QUERY)
                .then(() => done())
                .catch((commonServiceError) => done(commonServiceError));
            })
            .catch((commonServiceError) => done(commonServiceError));
        },
        false
      );
    }
  );
});

after((done) => {
  // here you can clear fixtures, etc.
  sails.lower(done);
});
