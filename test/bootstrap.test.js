const sails = require('sails');
const Fixted = require('fixted');
const sailsPostGreAdapter = require('sails-postgresql');
const customSQL = require('./customSQL');
const CommonService = require('../api/services/CommonService');

// Suppress Waterline adapter warnings about timestamp primary keys in history tables
/* eslint-disable no-console, func-names */
const originalWarn = console.warn;
console.warn = function (...args) {
  const message = args.join(' ');
  if (
    message.includes(
      'Records sent back from a database adapter should always have a valid property'
    ) ||
    message.includes('corresponds with the primary key attribute')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// this.timeout() is not accessible with an arrow function
/* eslint-disable func-names */
before(function (done) {
  this.timeout(20000);

  sails.lift(
    {
      log: {
        level: 'error', // Suppress warnings, only show errors
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
      async bootstrap() {
        // Replace the normal bootstrap.js
        await CommonService.query(customSQL.ALTER_MASSIF_COLUMN_GEOG_POLYGON);
        await CommonService.query(customSQL.ALTER_ENTRANCE_COLUMN_POINT_GEOM);
      },
    },

    // eslint-disable-next-line consistent-return
    async (err) => {
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
          'tiso31662',
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
          'vcaverroles',
          'vbibliographicmetadata',
        ],
        // eslint-disable-next-line consistent-return
        (fixtedError) => {
          if (fixtedError) {
            return done(fixtedError);
          }

          CommonService.query(customSQL.UPDATE_SEQUENCES_QUERY)
            .then(() => done())
            .catch((commonServiceError) => done(commonServiceError));
        },
        false
      );
    }
  );
});

after((done) => {
  // here you can clear fixtures, etc.
  sails.lower((err) => {
    if (err) {
      /* eslint-disable-next-line no-console */
      console.error('Error lowering sails:', err);
    }
    // Force exit after a short delay to ensure cleanup
    setTimeout(() => {
      process.exit(0);
    }, 100);
    done(err);
  });
});
