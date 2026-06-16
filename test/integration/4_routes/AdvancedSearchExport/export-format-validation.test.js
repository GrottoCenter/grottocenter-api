/* eslint-disable global-require */
const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

describe('Geo Export - Format Validation', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/v1/advanced-search/export', () => {
    it('should return 400 with valid format list when format is invalid', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=xml')
        .send({
          query: 'test',
          entity: 'entrances',
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(
            /format must be one of: csv, geojson, kml, gpx/
          );
          return done();
        });
    });

    it('should return 400 when geo format is used with non-entrance entity', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=geojson')
        .send({
          query: 'test',
          entity: 'caves',
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(
            /Geographic formats \(geojson, kml, gpx\) are only available for entrance searches/
          );
          return done();
        });
    });

    it('should validate format before entity restriction (invalid format error wins)', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=invalid')
        .send({
          query: 'test',
          entity: 'caves',
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(
            /format must be one of: csv, geojson, kml, gpx/
          );
          return done();
        });
    });

    it('should succeed with geo format even without columns/columnsName', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [
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
        ],
        found: 1,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=geojson')
        .send({
          query: 'test',
          entity: 'entrances',
        })
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });

    it('should return 400 for CSV format without columns (backward compat)', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'entrances',
          columnsName: ['ID'],
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          should(res.text).match(/columns must be a non-empty array/);
          return done();
        });
    });
  });
});
