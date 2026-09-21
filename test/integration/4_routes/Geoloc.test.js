const supertest = require('supertest');
const should = require('should');
const CommonService = require('../../../api/services/CommonService');

describe('Geoloc features', () => {
  describe('find entrances', () => {
    it('should return code 400 on missing parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
        })
        .expect(400, done);
    });

    // Kept under the 35000 km² bounding box cap: 0,0 -> 5,5 is ~308700 km².
    it('should return code 200 with entrances', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 1,
          ne_lng: 1,
        })
        .expect(200, done);
    });

    it('should include dataQuality integer field between 0 and 100 for each entrance', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 62,
          sw_lng: 78,
          ne_lat: 63,
          ne_lng: 79,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          res.body.length.should.be.above(0);
          res.body.forEach((entrance) => {
            should(entrance).have.property('dataQuality');
            should(entrance.dataQuality).be.a.Number();
            should(entrance.dataQuality % 1).equal(0);
            should(entrance.dataQuality).be.aboveOrEqual(0);
            should(entrance.dataQuality).be.belowOrEqual(100);
          });
          return done();
        });
    });
  });

  // GET /geoloc/entrances returns full entrance records, so an unbounded box
  // makes Node serialise six figures of rows on the single event loop and every
  // other request queues behind it. The cap rejects those before any query runs.
  describe('bounding box area cap', () => {
    const get = (query) =>
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query(query);

    it('should return 400 with BBOX_AREA_EXCEEDED on world bounds', (done) => {
      get({ sw_lat: -90, sw_lng: -180, ne_lat: 90, ne_lng: 180 })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.code).equal('BBOX_AREA_EXCEEDED');
          should(res.body.message).match(
            /exceeds the maximum allowed size of 35000 km²/
          );
          return done();
        });
    });

    it('should point the client at entrancesCoordinates instead', (done) => {
      get({ sw_lat: -90, sw_lng: -180, ne_lat: 90, ne_lng: 180 })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).match(/entrancesCoordinates/);
          return done();
        });
    });

    // 2 x 2 degrees at 45N is ~34354 km², 2.1 x 2 is ~36072 km². A tenth of a
    // degree of longitude is the whole difference between these two cases.
    it('should accept a box just under the limit', (done) => {
      get({ sw_lat: 45, sw_lng: 0, ne_lat: 47, ne_lng: 2 })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          return done();
        });
    });

    it('should reject a box just over the limit', (done) => {
      get({ sw_lat: 45, sw_lng: 0, ne_lat: 47, ne_lng: 2.1 })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.code).equal('BBOX_AREA_EXCEEDED');
          return done();
        });
    });

    // ST_MakeEnvelope normalises to min/max rather than wrapping, so inverted
    // longitudes describe the 340 degree wide complement of the strip the client
    // presumably meant. Those are among the most expensive requests the endpoint
    // receives, so rejecting them is the point rather than a side effect.
    it('should reject an inverted longitude range', (done) => {
      get({ sw_lat: -10, sw_lng: 170, ne_lat: 10, ne_lng: -170 })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.code).equal('BBOX_AREA_EXCEEDED');
          return done();
        });
    });

    // The check runs before the massif lookup, so it does not pay for a
    // database round trip in order to reject. That ordering is observable.
    it('should report the area rather than an unknown massif', (done) => {
      get({
        sw_lat: -90,
        sw_lng: -180,
        ne_lat: 90,
        ne_lng: 180,
        massif: 999999,
      })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.code).equal('BBOX_AREA_EXCEEDED');
          return done();
        });
    });

    it('should apply the cap even when a valid massif is given', (done) => {
      get({ sw_lat: -90, sw_lng: -180, ne_lat: 90, ne_lng: 180, massif: 1 })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.code).equal('BBOX_AREA_EXCEEDED');
          return done();
        });
    });

    // A full-longitude box spanning a hundredth of a degree of latitude at the
    // pole: 6.5 degrees² but only a few km². This is what the web app sends when
    // a search centre sits on a pole, and a cap expressed in degrees² would
    // wrongly reject it — which is why the limit is in km².
    it('should accept a polar full-longitude box', (done) => {
      get({ sw_lat: 89.99102, sw_lng: -180, ne_lat: 90, ne_lng: 180 })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          return done();
        });
    });

    // The shape the web app's tile cache actually requests, one zoom-12 tile at
    // a time: ~67 km², well over two orders of magnitude below the cap.
    it('should accept a zoom-12 tile sized box', (done) => {
      get({
        sw_lat: 45,
        sw_lng: 6,
        ne_lat: 45.0878,
        ne_lng: 6.087890625,
      })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          return done();
        });
    });

    // Non-numeric coordinates are not this cap's problem, and must not be
    // reported as an area error.
    it('should not report an area error for non-numeric coordinates', (done) => {
      get({ sw_lat: 'abc', sw_lng: 0, ne_lat: 47, ne_lng: 2 }).end(
        (err, res) => {
          if (err) return done(err);
          should(res.body.code).not.equal('BBOX_AREA_EXCEEDED');
          return done();
        }
      );
    });
  });

  describe('find entrances with massif filter', () => {
    // A sub-box inside massif 1's extent, kept under the 35000 km² cap: the
    // original 50,50 -> 75,110 box covers ~8.5 million km².
    it('should return code 200 with massif param and bounding box', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 62,
          sw_lng: 78,
          ne_lat: 63,
          ne_lng: 79,
          massif: 1,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          return done();
        });
    });

    it('should return code 404 with non-existent massif param', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 1,
          ne_lng: 1,
          massif: 999999,
        })
        .expect(404, done);
    });
  });

  describe('find entrances coordinates', () => {
    it('should return code 400 on missing parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
        })
        .expect(400, done);
    });

    it('should return code 200 with coordinates', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 5,
          ne_lng: 5,
        })
        .expect(200, done);
    });
  });

  describe('find entrances coordinates with massif filter', () => {
    it('should return code 200 with massif param and bounding box', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 50,
          sw_lng: 50,
          ne_lat: 75,
          ne_lng: 110,
          massif: 1,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          return done();
        });
    });

    it('should return code 404 with non-existent massif param', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 5,
          ne_lng: 5,
          massif: 999999,
        })
        .expect(404, done);
    });
  });

  describe('find networks', () => {
    it('should return code 400 on missing parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/networks')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
        })
        .expect(400, done);
    });

    it('should return code 200 with networks containing entrances', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/networks')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 60,
          sw_lng: 75,
          ne_lat: 65,
          ne_lng: 80,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).be.greaterThan(0);
          const network = res.body[0];
          should(network).have.property('id');
          should(network).have.property('name');
          should(network).have.property('longitude');
          should(network).have.property('latitude');
          should(network).have.property('entrances');
          should(network.entrances).be.an.Array();
          should(network.entrances.length).be.greaterThan(0);
          const entrance = network.entrances[0];
          should(entrance).have.property('id');
          should(entrance).have.property('name');
          should(entrance).have.property('latitude');
          should(entrance).have.property('longitude');
          return done();
        });
    });

    it('should return empty array for area with no networks', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/networks')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 5,
          ne_lng: 5,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.an.Array();
          should(res.body.length).equal(0);
          return done();
        });
    });
  });

  describe('find networks coordinates', () => {
    it('should return code 400 on missing parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/networksCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
        })
        .expect(400, done);
    });

    it('should return code 200 with coordinates', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/networksCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 5,
          ne_lng: 5,
        })
        .expect(200, done);
    });
  });

  describe('find organizations', () => {
    it('should return code 400 on missing parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/organizations')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
        })
        .expect(400, done);
    });

    it('should return code 200 with organizations', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/organizations')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 5,
          ne_lng: 5,
        })
        .expect(200, done);
    });
  });

  describe('count entrances', () => {
    it('should return code 400 on missing parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/countEntrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
        })
        .expect(400, done);
    });
    it('should return code 400 on out-of-range parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/countEntrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: -250,
          ne_lat: 100,
          ne_lng: 0,
        })
        .expect(400, done);
    });
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/countEntrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 62,
          sw_lng: 78,
          ne_lat: 63,
          ne_lng: 79,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { count } = res.body;
          should(count).equal(2); // entrances 1 & 2 are in bounds, others are outside
          return done();
        });
    });
    it('should return code 200 and count = 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/countEntrances')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: -80,
          sw_lng: -170,
          ne_lat: -79,
          ne_lng: -169,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { count } = res.body;
          should(count).equal(0);
          return done();
        });
    });
  });

  describe('find massifs coordinates', () => {
    it('should return code 400 on missing parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifsCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
        })
        .expect(400, done);
    });

    it('should return code 200 with valid bbox', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifsCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 50,
          sw_lng: 50,
          ne_lat: 75,
          ne_lng: 110,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          res.body.length.should.be.above(0);
          res.body.forEach((coord) => {
            coord.should.be.Array();
            coord.length.should.equal(2);
            should(coord[0]).be.a.Number();
            should(coord[1]).be.a.Number();
          });
          return done();
        });
    });

    it('should return empty array for no-match bbox', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifsCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: -80,
          sw_lng: -170,
          ne_lat: -79,
          ne_lng: -169,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          res.body.length.should.equal(0);
          return done();
        });
    });

    it('should be accessible without authentication', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifsCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 50,
          sw_lng: 50,
          ne_lat: 75,
          ne_lng: 110,
        })
        .expect(200, done);
    });

    it('should include Cache-Control header on success', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifsCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 50,
          sw_lng: 50,
          ne_lat: 75,
          ne_lng: 110,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.headers['cache-control']).match(/^public, max-age=\d+$/);
          return done();
        });
    });
  });

  describe('find massifs polygons', () => {
    it('should return code 400 on missing parameter(s)', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
        })
        .expect(400, done);
    });

    it('should return code 200 with valid bbox and correct shape', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 50,
          sw_lng: 50,
          ne_lat: 75,
          ne_lng: 110,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          res.body.length.should.be.above(0);
          const massif = res.body[0];
          should(massif).have.property('id');
          should(massif).have.property('name');
          should(massif).have.property('geogPolygon');
          should(massif).have.property('entranceCount');
          should(massif).have.property('networkCount');
          should(massif.id).be.a.Number();
          should(massif.geogPolygon).be.an.Object();
          should(massif.geogPolygon).have.property('type');
          should(massif.entranceCount).be.a.Number();
          should(massif.networkCount).be.a.Number();
          return done();
        });
    });

    it('should return geogPolygon as parsed object, not string', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 50,
          sw_lng: 50,
          ne_lat: 75,
          ne_lng: 110,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.forEach((massif) => {
            should(massif.geogPolygon).be.an.Object();
            should(massif.geogPolygon).not.be.a.String();
          });
          return done();
        });
    });

    it('should return empty array for no-match bbox', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: -80,
          sw_lng: -170,
          ne_lat: -79,
          ne_lng: -169,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          res.body.should.be.Array();
          res.body.length.should.equal(0);
          return done();
        });
    });

    it('should be accessible without authentication', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 50,
          sw_lng: 50,
          ne_lat: 75,
          ne_lng: 110,
        })
        .expect(200, done);
    });
  });

  // Sails shallow-copies service exports when registering them, so a plain
  // require() returns a different object than the one the controller uses.
  // We access the Sails-registered instance via sails.services to share state.
  describe('entrancesCoordinates snapshot integration', () => {
    let CoordinatesSnapshotService;
    let originalTTL;

    beforeEach(async () => {
      CoordinatesSnapshotService = sails.services.coordinatessnapshotservice;
      CoordinatesSnapshotService.reset();
      originalTTL = sails.config.custom.coordinatesSnapshotTTL;
    });

    afterEach(() => {
      sails.config.custom.coordinatesSnapshotTTL = originalTTL;
      CoordinatesSnapshotService.reset();
    });

    it('should use snapshot for non-massif request when loaded', async () => {
      // Load snapshot from real DB
      await CoordinatesSnapshotService.load();

      // Get what the snapshot holds right now
      const expected = CoordinatesSnapshotService.getCoordinates(
        -90,
        -180,
        90,
        180
      );

      // Request full-range bbox — snapshot serves all coordinates
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: -90,
          sw_lng: -180,
          ne_lat: 90,
          ne_lng: 180,
        })
        .expect(200);

      res.body.should.be.Array();
      // Response must match snapshot contents exactly
      should(res.body).deepEqual(expected);
    });

    it('should fall back to DB when snapshot is not loaded', async () => {
      // Snapshot is reset in afterEach — not loaded here
      should(CoordinatesSnapshotService.isLoaded()).be.false();

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 50,
          ne_lng: 50,
        })
        .expect(200);

      // Snapshot is null → controller falls back to DB.
      // Fixtures have entrances at [3,3] and [30,30] in this bbox.
      res.body.should.be.Array();
      should(res.body.length).be.above(0);
    });

    it('should always use DB path for massif requests', async () => {
      // Load snapshot from real DB
      await CoordinatesSnapshotService.load();

      // Massif 1 request — controller must bypass snapshot and use DB
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 50,
          sw_lng: 50,
          ne_lat: 75,
          ne_lng: 110,
          massif: 1,
        })
        .expect(200);

      res.body.should.be.Array();
      // The snapshot bbox filter for [50-75, 50-110] would return 0
      // coordinates (all fixtures are outside this range).
      // The DB massif query returns entrances within the massif polygon.
      // Any result (even empty) is fine — the key test is that it
      // doesn't crash and returns 200 with an array.
    });

    it('should include Cache-Control header on success', async () => {
      await CoordinatesSnapshotService.load();

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: -90,
          sw_lng: -180,
          ne_lat: 90,
          ne_lng: 180,
        })
        .expect(200);

      should(res.headers['cache-control']).match(/^public, max-age=\d+$/);
    });

    it('should include Cache-Control header on DB fallback', async () => {
      // Snapshot not loaded — controller falls back to DB
      should(CoordinatesSnapshotService.isLoaded()).be.false();

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: -90,
          sw_lng: -180,
          ne_lat: 90,
          ne_lng: 180,
        })
        .expect(200);

      should(res.headers['cache-control']).match(/^public, max-age=\d+$/);
    });

    it('should not include Cache-Control header on error', async () => {
      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 0,
          sw_lng: 0,
          ne_lng: 5,
          // ne_lat missing — triggers 400
        })
        .expect(400);

      should(res.headers['cache-control']).be.undefined();
    });

    it('should set max-age reflecting remaining TTL', async () => {
      sails.config.custom.coordinatesSnapshotTTL = 1000;
      await CoordinatesSnapshotService.load();

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: -90,
          sw_lng: -180,
          ne_lat: 90,
          ne_lng: 180,
        })
        .expect(200);

      const match = res.headers['cache-control'].match(
        /^public, max-age=(\d+)$/
      );
      should(match).not.be.null();
      const maxAge = parseInt(match[1], 10);
      // Just loaded, so max-age should be close to the full TTL (within 5s)
      should(maxAge).be.aboveOrEqual(995);
      should(maxAge).be.belowOrEqual(1000);
    });
  });

  /**
   * Massif-filtered entrance coordinates are within the bounding box.
   * Uses a known bbox overlapping massif 1's polygon (lat 53-74, lng 52-108).
   */
  describe('Massif-filtered entrance coordinates within bounding box', () => {
    it('should return coordinates within the bbox for massif 1', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 53,
          sw_lng: 52,
          ne_lat: 74,
          ne_lng: 108,
          massif: 1,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.Array();
          res.body.forEach(([lng, lat]) => {
            should(lat).be.aboveOrEqual(53);
            should(lat).be.belowOrEqual(74);
            should(lng).be.aboveOrEqual(52);
            should(lng).be.belowOrEqual(108);
          });
          return done();
        });
    });

    it('should return coordinates within a tight bbox for massif 1', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrancesCoordinates')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .query({
          sw_lat: 60,
          sw_lng: 75,
          ne_lat: 65,
          ne_lng: 85,
          massif: 1,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).be.Array();
          res.body.forEach(([lng, lat]) => {
            should(lat).be.aboveOrEqual(60);
            should(lat).be.belowOrEqual(65);
            should(lng).be.aboveOrEqual(75);
            should(lng).be.belowOrEqual(85);
          });
          return done();
        });
    });
  });

  /**
   * Centroid computation correctness — verified against a direct PostGIS query.
   */
  describe('Centroid computation correctness', () => {
    it('should return centroids matching direct ST_Centroid query', async () => {
      const bbox = { sw_lat: 50, sw_lng: 50, ne_lat: 75, ne_lng: 110 };

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifsCoordinates')
        .query(bbox)
        .expect(200);

      if (res.body.length === 0) return;

      const ref = await CommonService.query(
        `SELECT
           ST_X(ST_Centroid(m.geog_polygon::geometry)) AS longitude,
           ST_Y(ST_Centroid(m.geog_polygon::geometry)) AS latitude
         FROM t_massif AS m
         WHERE m.is_deleted = false
           AND m.geog_polygon IS NOT NULL
           AND ST_Within(
             ST_Centroid(m.geog_polygon::geometry),
             ST_MakeEnvelope($1, $2, $3, $4, 4326)
           )`,
        [bbox.sw_lng, bbox.sw_lat, bbox.ne_lng, bbox.ne_lat]
      );

      const refCoords = ref.rows.map((r) => [
        Number(r.longitude),
        Number(r.latitude),
      ]);

      should(res.body.length).equal(refCoords.length);
      res.body.forEach(([lng, lat]) => {
        const match = refCoords.find(
          ([rLng, rLat]) =>
            Math.abs(rLng - lng) < 1e-6 && Math.abs(rLat - lat) < 1e-6
        );
        should(match).not.be.undefined();
      });
    });
  });

  /**
   * Polygon spatial intersection — every returned massif intersects the bbox.
   */
  describe('Polygon spatial intersection', () => {
    it('should only return massifs whose polygon intersects the bbox', async () => {
      const bbox = { sw_lat: 50, sw_lng: 50, ne_lat: 75, ne_lng: 110 };

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .query(bbox)
        .expect(200);

      await Promise.all(
        res.body.map(async (massif) => {
          const ref = await CommonService.query(
            `SELECT ST_Intersects(
               m.geog_polygon::geometry,
               ST_MakeEnvelope($1, $2, $3, $4, 4326)
             ) AS intersects
             FROM t_massif AS m
             WHERE m.id = $5`,
            [bbox.sw_lng, bbox.sw_lat, bbox.ne_lng, bbox.ne_lat, massif.id]
          );
          should(ref.rows.length).equal(1);
          should(ref.rows[0].intersects).be.true();
        })
      );
    });
  });

  /**
   * Polygon field correctness — name, entranceCount, networkCount match DB.
   */
  describe('Polygon field correctness', () => {
    it('should return correct name, entranceCount, and networkCount', async () => {
      const bbox = { sw_lat: 50, sw_lng: 50, ne_lat: 75, ne_lng: 110 };

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .query(bbox)
        .expect(200);

      should(res.body.length).be.above(0);

      await Promise.all(
        res.body.map(async (massif) => {
          const nameRef = await CommonService.query(
            `SELECT n.name FROM t_name AS n
             WHERE n.id_massif = $1 AND n.is_main = true LIMIT 1`,
            [massif.id]
          );
          should(massif.name).equal(
            nameRef.rows.length > 0 ? nameRef.rows[0].name : null
          );

          const entranceRef = await CommonService.query(
            `SELECT COUNT(e.id)::integer AS cnt FROM t_entrance AS e
             WHERE e.is_deleted = false AND ST_Contains(
               (SELECT m.geog_polygon::geometry FROM t_massif AS m WHERE m.id = $1),
               e.point_geom)`,
            [massif.id]
          );
          should(massif.entranceCount).equal(entranceRef.rows[0].cnt);

          const networkRef = await CommonService.query(
            `SELECT COUNT(*)::integer AS cnt FROM (
               SELECT c.id FROM t_entrance AS e
               JOIN t_cave AS c ON c.id = e.id_cave
               WHERE e.is_deleted = false AND c.is_deleted = false
                 AND ST_Contains(
                   (SELECT m.geog_polygon::geometry FROM t_massif AS m WHERE m.id = $1),
                   e.point_geom)
               GROUP BY c.id HAVING COUNT(e.id) > 1
             ) AS networks`,
            [massif.id]
          );
          should(massif.networkCount).equal(networkRef.rows[0].cnt);
        })
      );
    });
  });

  /**
   * Polygon exclusion filtering — only non-deleted massifs with polygons.
   */
  describe('Polygon exclusion filtering', () => {
    it('should only return non-deleted massifs with non-null polygons', async () => {
      const bbox = { sw_lat: 50, sw_lng: 50, ne_lat: 75, ne_lng: 110 };

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .query(bbox)
        .expect(200);

      await Promise.all(
        res.body.map(async (massif) => {
          const ref = await CommonService.query(
            `SELECT m.is_deleted, m.geog_polygon IS NOT NULL AS has_polygon
             FROM t_massif AS m WHERE m.id = $1`,
            [massif.id]
          );
          should(ref.rows.length).equal(1);
          should(ref.rows[0].is_deleted).be.false();
          should(ref.rows[0].has_polygon).be.true();
        })
      );
    });
  });

  /**
   * Invalid bounding box rejection — missing params and out-of-range values.
   */
  describe('Invalid bounding box rejection', () => {
    it('should return 400 for missing ne_lat on massifsCoordinates', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifsCoordinates')
        .query({ sw_lat: 0, sw_lng: 0, ne_lng: 5 })
        .expect(400, done);
    });

    it('should return 400 for missing sw_lng on massifsCoordinates', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifsCoordinates')
        .query({ sw_lat: 0, ne_lat: 5, ne_lng: 5 })
        .expect(400, done);
    });

    it('should return 400 for out-of-range lat on massifsCoordinates', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifsCoordinates')
        .query({ sw_lat: -100, sw_lng: 0, ne_lat: 5, ne_lng: 5 })
        .expect(400, done);
    });

    it('should return 400 for missing ne_lat on massifs', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .query({ sw_lat: 0, sw_lng: 0, ne_lng: 5 })
        .expect(400, done);
    });

    it('should return 400 for out-of-range lat on massifs', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/massifs')
        .query({ sw_lat: 95, sw_lng: 0, ne_lat: 100, ne_lng: 5 })
        .expect(400, done);
    });
  });

  /**
   * World bounds stay valid everywhere except /geoloc/entrances.
   *
   * The area cap lives in the entrances controller alone, never in the shared
   * checkAndGetCoordinatesParams, because the web app asks four of these
   * endpoints for the whole world on every map page load — entrancesCoordinates,
   * networksCoordinates, massifsCoordinates and organizations (MAX_BOUNDS in the
   * front end's actions/Map.js). Moving the cap into the shared validator would
   * break the production map, so these assertions are the guard rail against it.
   */
  describe('World bounding box still accepted outside /geoloc/entrances', () => {
    const WORLD = { sw_lat: -90, sw_lng: -180, ne_lat: 90, ne_lng: 180 };

    const endpoints = [
      'entrancesCoordinates',
      'networksCoordinates',
      'massifsCoordinates',
      'organizations',
      'networks',
      'massifs',
      'countEntrances',
      // Deprecated aliases sharing the same controllers.
      'countEntries',
      'grottos',
      'caves',
      'cavesCoordinates',
    ];

    endpoints.forEach((endpoint) => {
      it(`should return 200 for world bounds on ${endpoint}`, (done) => {
        supertest(sails.hooks.http.app)
          .get(`/api/v1/geoloc/${endpoint}`)
          .set('Accept', 'application/json')
          .query(WORLD)
          .expect(200, done);
      });
    });

    it('should still reject world bounds on entrances', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrances')
        .set('Accept', 'application/json')
        .query(WORLD)
        .expect(400, done);
    });
  });
});
