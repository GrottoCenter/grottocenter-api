var sails = require('sails');
var Barrels = require('barrels');

before(function(done) {

  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(5000);

  sails.lift({
    log: {
      level: 'verbose'
    },
    models: {
      connection: 'test',
      migrate: 'drop'	
    },
	csrf: false,
  }, function(err, server) {
    if (err) return done(err);
    // here you can load fixtures, etc.
	
	// Load fixtures
    var barrels = new Barrels();

    // Save original objects in `fixtures` variable
    fixtures = barrels.data;

    // Populate the DB
	barrels.populate(function(err) {
		done(err, sails);
	});
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(done);
});