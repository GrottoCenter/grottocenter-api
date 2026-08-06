/* eslint-disable global-require */
const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

describe('Geo Export - GPX', () => {
  afterEach(() => {
    sinon.restore();
  });

  const entranceHits = [
    {
      document: {
        id: '1',
        name: 'Cave A',
        latitude: 45.0,
        longitude: 2.0,
        altitude: 500,
        isSensitive: false,
        country: 'FR',
      },
    },
    {
      document: {
        id: '2',
        name: 'Cave B',
        latitude: -12.5,
        longitude: 130.7,
        altitude: null,
        isSensitive: false,
        country: 'AU',
      },
    },
  ];

  const entranceHitsWithSensitive = [
    {
      document: {
        id: '1',
        name: 'Cave A',
        latitude: 45.0,
        longitude: 2.0,
        altitude: 500,
        isSensitive: false,
      },
    },
    {
      document: {
        id: '2',
        name: 'Secret Cave',
        latitude: 46.0,
        longitude: 3.0,
        altitude: 200,
        isSensitive: true,
      },
    },
  ];

  describe('POST /api/v1/advanced-search/export?format=gpx', () => {
    it('should return Content-Type application/gpx+xml', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=gpx')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .expect('Content-Type', /application\/gpx\+xml/)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });

    it('should return Content-Disposition with .gpx extension', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=gpx')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.headers['content-disposition']).match(/\.gpx"/);
          return done();
        });
    });

    it('should produce valid GPX with correct namespace, version, and creator', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=gpx')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const body = res.text;
          should(body).match(
            /xmlns="http:\/\/www\.topografix\.com\/GPX\/1\/1"/
          );
          should(body).match(/version="1\.1"/);
          should(body).match(/creator="Grottocenter"/);
          should(body).match(/<metadata>/);
          should(body).match(/<name>Grottocenter<\/name>/);
          should(body).match(
            /<desc>Exported from https:\/\/grottocenter\.org<\/desc>/
          );
          should(body).match(/<time>/);
          should(body).match(/<wpt lat="45" lon="2">/);
          should(body).match(/<\/gpx>/);
          return done();
        });
    });

    it('should exclude sensitive entrances from output', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHitsWithSensitive,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=gpx')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const body = res.text;
          should(body).match(/<name>Cave A<\/name>/);
          should(body).not.match(/Secret Cave/);
          return done();
        });
    });

    it('should populate <name> even when field mapping is active', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=gpx')
        .send({
          query: 'test',
          entity: 'entrances',
          columns: ['country'],
          columnsName: ['Pays'],
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const body = res.text;
          should(body).match(/<name>Cave A<\/name>/);
          should(body).match(/<name>Cave B<\/name>/);
          return done();
        });
    });

    it('should include <ele> element only when altitude is non-null', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=gpx')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const body = res.text;
          // Cave A has altitude 500
          should(body).match(/<ele>500<\/ele>/);
          // Cave B has altitude null — no <ele> element for it
          // Split by <wpt to isolate each waypoint
          const wpts = body.split('<wpt');
          // wpts[0] is prologue, wpts[1] is Cave A, wpts[2] is Cave B
          should(wpts[1]).match(/<ele>500<\/ele>/);
          should(wpts[2]).not.match(/<ele>/);
          return done();
        });
    });
  });
});
