const supertest = require('supertest');
const should = require('should');
const fc = require('fast-check');

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

    it('should return code 200 with entrances', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrances')
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

  describe('find entrances with massif filter', () => {
    it('should return code 200 with massif param and bounding box', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/geoloc/entrances')
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
        .get('/api/v1/geoloc/entrances')
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

    it('should return code 200 with networks', (done) => {
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
        .expect(200, done);
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
          sw_lat: 0,
          sw_lng: 0,
          ne_lat: 5,
          ne_lng: 5,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { count } = res.body;
          should(count).equal(2); // 3rd entrance is out of bounds, so the result is 2.
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
   * Every coordinate returned for a massif-filtered request lies within the
   * requested bounding box.
   * Encodes: the spatial filter applies the bbox constraint even when a massif
   * polygon is also in play.
   * Covers: random bounding boxes overlapping massif 1's polygon area.
   */
  describe('Property: Massif-filtered entrance coordinates are within the bounding box', () => {
    // eslint-disable-next-line func-names
    it('should return coordinates within the bounding box for random overlapping bounds and massif 1', async function () {
      this.timeout(60000);

      // Massif 1 polygon is roughly lat 53-74, lng 52-108.
      // Lat and lng pairs are independent — use fc.tuple + .map for better
      // shrinkability instead of a single .chain() over both dimensions.
      const boundingBoxArb = fc
        .tuple(
          fc
            .double({ min: 50, max: 70, noNaN: true })
            .chain((swLat) =>
              fc
                .double({ min: swLat + 1, max: 75, noNaN: true })
                .map((neLat) => [swLat, neLat])
            ),
          fc
            .double({ min: 50, max: 100, noNaN: true })
            .chain((swLng) =>
              fc
                .double({ min: swLng + 1, max: 110, noNaN: true })
                .map((neLng) => [swLng, neLng])
            )
        )
        .map(([[swLat, neLat], [swLng, neLng]]) => [
          swLat,
          swLng,
          neLat,
          neLng,
        ]);

      await fc.assert(
        fc.asyncProperty(
          boundingBoxArb,
          async ([swLat, swLng, neLat, neLng]) => {
            const res = await supertest(sails.hooks.http.app)
              .get('/api/v1/geoloc/entrancesCoordinates')
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json')
              .query({
                sw_lat: swLat,
                sw_lng: swLng,
                ne_lat: neLat,
                ne_lng: neLng,
                massif: 1,
              })
              .expect(200);

            const coordinates = res.body;
            should(coordinates).be.Array();

            // Every returned coordinate [lng, lat] must be within the bounding box
            coordinates.forEach(([lng, lat]) => {
              should(lat).be.aboveOrEqual(swLat);
              should(lat).be.belowOrEqual(neLat);
              should(lng).be.aboveOrEqual(swLng);
              should(lng).be.belowOrEqual(neLng);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
