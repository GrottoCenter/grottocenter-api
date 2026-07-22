/* eslint-disable global-require */
const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

describe('Geo Export - KML', () => {
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

  describe('POST /api/v1/advanced-search/export?format=kml', () => {
    it('should return Content-Type application/vnd.google-earth.kml+xml', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=kml')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .expect('Content-Type', /application\/vnd\.google-earth\.kml\+xml/)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });

    it('should return Content-Disposition with .kml extension', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=kml')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.headers['content-disposition']).match(/\.kml"/);
          return done();
        });
    });

    it('should produce valid KML with correct namespace and metadata', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=kml')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const body = res.text;
          should(body).match(/xmlns="http:\/\/www\.opengis\.net\/kml\/2\.2"/);
          should(body).match(/<Document>/);
          should(body).match(/<name>Grottocenter<\/name>/);
          should(body).match(
            /<description>Exported from https:\/\/grottocenter\.org<\/description>/
          );
          should(body).match(/<TimeStamp><when>/);
          should(body).match(/<Placemark>/);
          should(body).match(/<coordinates>2,45,500<\/coordinates>/);
          should(body).match(/<\/Document><\/kml>/);
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
        .post('/api/v1/advanced-search/export?format=kml')
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
        .post('/api/v1/advanced-search/export?format=kml')
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

    it('should omit altitude from coordinates when absent', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [
          {
            document: {
              id: '1',
              name: 'No Alt Cave',
              latitude: 45.0,
              longitude: 2.0,
              altitude: null,
              isSensitive: false,
            },
          },
        ],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=kml')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/<coordinates>2,45<\/coordinates>/);
          return done();
        });
    });
  });
});
