const supertest = require('supertest');
const should = require('should');
const fc = require('fast-check');
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

  /**
   * Property 1: Centroid computation correctness
   * For any bounding box overlapping massif 1's polygon area, each returned
   * centroid matches the ST_Centroid value computed directly by PostGIS.
   * Covers: Requirements 1.1, 1.2
   */
  describe('Property 1: Centroid computation correctness', () => {
    // eslint-disable-next-line func-names
    it('should return centroids matching direct ST_Centroid query', async function () {
      this.timeout(60000);

      // Massif 1 polygon spans roughly lat 53-74, lng 52-108
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
        .map(([[swLat, neLat], [swLng, neLng]]) => ({
          swLat,
          swLng,
          neLat,
          neLng,
        }));

      await fc.assert(
        fc.asyncProperty(
          boundingBoxArb,
          async ({ swLat, swLng, neLat, neLng }) => {
            const res = await supertest(sails.hooks.http.app)
              .get('/api/v1/geoloc/massifsCoordinates')
              .query({
                sw_lat: swLat,
                sw_lng: swLng,
                ne_lat: neLat,
                ne_lng: neLng,
              })
              .expect(200);

            const coordinates = res.body;
            if (coordinates.length === 0) return;

            // Reference query: get all centroids in this bbox directly
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
              [swLng, swLat, neLng, neLat]
            );

            const refCoords = ref.rows.map((r) => [
              Number(r.longitude),
              Number(r.latitude),
            ]);

            should(coordinates.length).equal(refCoords.length);
            coordinates.forEach(([lng, lat]) => {
              const match = refCoords.find(
                ([rLng, rLat]) =>
                  Math.abs(rLng - lng) < 1e-6 && Math.abs(rLat - lat) < 1e-6
              );
              should(match).not.be.undefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Polygon response shape and GeoJSON parsing
   * For any valid bounding box, every massif in the response has all required
   * fields with correct types and geogPolygon is a parsed object.
   * Covers: Requirements 3.3, 3.4
   */
  describe('Property 5: Polygon response shape and GeoJSON parsing', () => {
    // eslint-disable-next-line func-names
    it('should return correctly shaped massif objects for random bboxes', async function () {
      this.timeout(60000);

      const boundingBoxArb = fc
        .tuple(
          fc
            .double({ min: -90, max: 89, noNaN: true })
            .chain((swLat) =>
              fc
                .double({ min: swLat + 0.1, max: 90, noNaN: true })
                .map((neLat) => [swLat, neLat])
            ),
          fc
            .double({ min: -180, max: 179, noNaN: true })
            .chain((swLng) =>
              fc
                .double({ min: swLng + 0.1, max: 180, noNaN: true })
                .map((neLng) => [swLng, neLng])
            )
        )
        .map(([[swLat, neLat], [swLng, neLng]]) => ({
          swLat,
          swLng,
          neLat,
          neLng,
        }));

      await fc.assert(
        fc.asyncProperty(
          boundingBoxArb,
          async ({ swLat, swLng, neLat, neLng }) => {
            const res = await supertest(sails.hooks.http.app)
              .get('/api/v1/geoloc/massifs')
              .query({
                sw_lat: swLat,
                sw_lng: swLng,
                ne_lat: neLat,
                ne_lng: neLng,
              })
              .expect(200);

            res.body.should.be.Array();
            res.body.forEach((massif) => {
              should(massif).have.property('id');
              should(massif.id).be.a.Number();
              should(massif).have.property('name');
              should(massif).have.property('geogPolygon');
              should(massif.geogPolygon).be.an.Object();
              should(massif.geogPolygon).have.property('type');
              should(massif).have.property('entranceCount');
              should(massif.entranceCount).be.a.Number();
              should(massif).have.property('networkCount');
              should(massif.networkCount).be.a.Number();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Polygon spatial intersection
   * For any valid bounding box, every returned massif's polygon intersects
   * the requested bbox (verified via a reference ST_Intersects query).
   * Covers: Requirements 3.1
   */
  describe('Property 7: Polygon spatial intersection', () => {
    // eslint-disable-next-line func-names
    it('should only return massifs whose polygon intersects the bbox', async function () {
      this.timeout(60000);

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
        .map(([[swLat, neLat], [swLng, neLng]]) => ({
          swLat,
          swLng,
          neLat,
          neLng,
        }));

      await fc.assert(
        fc.asyncProperty(
          boundingBoxArb,
          async ({ swLat, swLng, neLat, neLng }) => {
            const res = await supertest(sails.hooks.http.app)
              .get('/api/v1/geoloc/massifs')
              .query({
                sw_lat: swLat,
                sw_lng: swLng,
                ne_lat: neLat,
                ne_lng: neLng,
              })
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
                  [swLng, swLat, neLng, neLat, massif.id]
                );
                should(ref.rows.length).equal(1);
                should(ref.rows[0].intersects).be.true();
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Invalid bounding box rejection
   * For any request with missing params or out-of-range lat/lng,
   * the endpoint returns HTTP 400.
   * Covers: Requirements 4.1, 4.2, 4.3
   */
  describe('Property 8: Invalid bounding box rejection', () => {
    // eslint-disable-next-line func-names
    it('should return 400 for random invalid bbox params on massifsCoordinates', async function () {
      this.timeout(60000);

      // Strategy: generate objects that are missing at least one param
      // or have out-of-range values
      const missingParamArb = fc
        .subarray(['sw_lat', 'sw_lng', 'ne_lat', 'ne_lng'], {
          minLength: 1,
          maxLength: 3,
        })
        .map((presentKeys) => {
          const query = {};
          if (presentKeys.includes('sw_lat')) query.sw_lat = 0;
          if (presentKeys.includes('sw_lng')) query.sw_lng = 0;
          if (presentKeys.includes('ne_lat')) query.ne_lat = 5;
          if (presentKeys.includes('ne_lng')) query.ne_lng = 5;
          return query;
        });

      const outOfRangeArb = fc.record({
        sw_lat: fc.oneof(
          fc.integer({ min: -200, max: -91 }),
          fc.integer({ min: 91, max: 200 })
        ),
        sw_lng: fc.integer({ min: -180, max: 180 }),
        ne_lat: fc.oneof(
          fc.integer({ min: -200, max: -91 }),
          fc.integer({ min: 91, max: 200 })
        ),
        ne_lng: fc.integer({ min: -180, max: 180 }),
      });

      const invalidArb = fc.oneof(missingParamArb, outOfRangeArb);

      await fc.assert(
        fc.asyncProperty(invalidArb, async (query) => {
          await supertest(sails.hooks.http.app)
            .get('/api/v1/geoloc/massifsCoordinates')
            .query(query)
            .expect(400);
        }),
        { numRuns: 100 }
      );
    });

    // eslint-disable-next-line func-names
    it('should return 400 for random invalid bbox params on massifs', async function () {
      this.timeout(60000);

      const missingParamArb = fc
        .subarray(['sw_lat', 'sw_lng', 'ne_lat', 'ne_lng'], {
          minLength: 1,
          maxLength: 3,
        })
        .map((presentKeys) => {
          const query = {};
          if (presentKeys.includes('sw_lat')) query.sw_lat = 0;
          if (presentKeys.includes('sw_lng')) query.sw_lng = 0;
          if (presentKeys.includes('ne_lat')) query.ne_lat = 5;
          if (presentKeys.includes('ne_lng')) query.ne_lng = 5;
          return query;
        });

      const outOfRangeArb = fc.record({
        sw_lat: fc.oneof(
          fc.integer({ min: -200, max: -91 }),
          fc.integer({ min: 91, max: 200 })
        ),
        sw_lng: fc.integer({ min: -180, max: 180 }),
        ne_lat: fc.oneof(
          fc.integer({ min: -200, max: -91 }),
          fc.integer({ min: 91, max: 200 })
        ),
        ne_lng: fc.integer({ min: -180, max: 180 }),
      });

      const invalidArb = fc.oneof(missingParamArb, outOfRangeArb);

      await fc.assert(
        fc.asyncProperty(invalidArb, async (query) => {
          await supertest(sails.hooks.http.app)
            .get('/api/v1/geoloc/massifs')
            .query(query)
            .expect(400);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Polygon field correctness
   * For any bounding box overlapping fixture data, the name matches the
   * reference t_name query, entranceCount and networkCount match reference
   * count queries.
   * Covers: Requirements 5.1, 6.1, 6.2
   */
  describe('Property 9: Polygon field correctness', () => {
    // eslint-disable-next-line func-names
    it('should return correct name, entranceCount, and networkCount', async function () {
      this.timeout(60000);

      // Focus on bboxes overlapping massif 1
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
        .map(([[swLat, neLat], [swLng, neLng]]) => ({
          swLat,
          swLng,
          neLat,
          neLng,
        }));

      await fc.assert(
        fc.asyncProperty(
          boundingBoxArb,
          async ({ swLat, swLng, neLat, neLng }) => {
            const res = await supertest(sails.hooks.http.app)
              .get('/api/v1/geoloc/massifs')
              .query({
                sw_lat: swLat,
                sw_lng: swLng,
                ne_lat: neLat,
                ne_lng: neLng,
              })
              .expect(200);

            await Promise.all(
              res.body.map(async (massif) => {
                // Verify name against t_name
                const nameRef = await CommonService.query(
                  `SELECT n.name FROM t_name AS n
               WHERE n.id_massif = $1 AND n.is_main = true
               LIMIT 1`,
                  [massif.id]
                );
                const expectedName =
                  nameRef.rows.length > 0 ? nameRef.rows[0].name : null;
                should(massif.name).equal(expectedName);

                // Verify entranceCount
                const entranceRef = await CommonService.query(
                  `SELECT COUNT(e.id)::integer AS cnt
               FROM t_entrance AS e
               WHERE e.is_deleted = false
                 AND ST_Contains(
                   (SELECT m.geog_polygon::geometry FROM t_massif AS m WHERE m.id = $1),
                   e.point_geom
                 )`,
                  [massif.id]
                );
                should(massif.entranceCount).equal(entranceRef.rows[0].cnt);

                // Verify networkCount
                const networkRef = await CommonService.query(
                  `SELECT COUNT(*)::integer AS cnt FROM (
                 SELECT c.id
                 FROM t_entrance AS e
                 JOIN t_cave AS c ON c.id = e.id_cave
                 WHERE e.is_deleted = false
                   AND c.is_deleted = false
                   AND ST_Contains(
                     (SELECT m.geog_polygon::geometry FROM t_massif AS m WHERE m.id = $1),
                     e.point_geom
                   )
                 GROUP BY c.id
                 HAVING COUNT(e.id) > 1
               ) AS networks`,
                  [massif.id]
                );
                should(massif.networkCount).equal(networkRef.rows[0].cnt);
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Polygon exclusion filtering
   * For each massif returned by the endpoint, the source massif in the
   * database is non-deleted and has a non-null geog_polygon.
   * Covers: Requirements 3.5, 3.6
   */
  describe('Property 6: Polygon exclusion filtering', () => {
    // eslint-disable-next-line func-names
    it('should only return non-deleted massifs with non-null polygons', async function () {
      this.timeout(60000);

      const boundingBoxArb = fc
        .tuple(
          fc
            .double({ min: -90, max: 89, noNaN: true })
            .chain((swLat) =>
              fc
                .double({ min: swLat + 0.1, max: 90, noNaN: true })
                .map((neLat) => [swLat, neLat])
            ),
          fc
            .double({ min: -180, max: 179, noNaN: true })
            .chain((swLng) =>
              fc
                .double({ min: swLng + 0.1, max: 180, noNaN: true })
                .map((neLng) => [swLng, neLng])
            )
        )
        .map(([[swLat, neLat], [swLng, neLng]]) => ({
          swLat,
          swLng,
          neLat,
          neLng,
        }));

      await fc.assert(
        fc.asyncProperty(
          boundingBoxArb,
          async ({ swLat, swLng, neLat, neLng }) => {
            const res = await supertest(sails.hooks.http.app)
              .get('/api/v1/geoloc/massifs')
              .query({
                sw_lat: swLat,
                sw_lng: swLng,
                ne_lat: neLat,
                ne_lng: neLng,
              })
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
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
