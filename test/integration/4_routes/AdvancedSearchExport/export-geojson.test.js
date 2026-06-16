/* eslint-disable global-require */
const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');

describe('Geo Export - GeoJSON', () => {
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

  const entranceHitsWithMissingCoords = [
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
        name: 'No Coords Cave',
        latitude: null,
        longitude: null,
        altitude: null,
        isSensitive: false,
      },
    },
  ];

  describe('POST /api/v1/advanced-search/export?format=geojson', () => {
    it('should return Content-Type application/geo+json', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=geojson')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .expect('Content-Type', /application\/geo\+json/)
        .end((err) => {
          if (err) return done(err);
          return done();
        });
    });

    it('should return Content-Disposition with .geojson extension', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=geojson')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.headers['content-disposition']).match(/\.geojson"/);
          return done();
        });
    });

    it('should produce valid GeoJSON FeatureCollection with correct metadata', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=geojson')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const geojson = JSON.parse(res.text);
          should(geojson.type).equal('FeatureCollection');
          should(geojson.name).equal('Grottocenter');
          should(geojson.description).equal(
            'Exported from https://grottocenter.org'
          );
          should(geojson.timestamp).be.a.String();
          should(geojson.features).be.an.Array();
          should(geojson.features).have.length(2);
          should(geojson.features[0].type).equal('Feature');
          should(geojson.features[0].geometry.type).equal('Point');
          should(geojson.features[0].geometry.coordinates).eql([2.0, 45.0]);
          should(geojson.features[0].properties.url).equal(
            'https://grottocenter.org/ui/entrances/1'
          );
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
        .post('/api/v1/advanced-search/export?format=geojson')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const geojson = JSON.parse(res.text);
          should(geojson.features).have.length(1);
          should(geojson.features[0].properties.name).equal('Cave A');
          return done();
        });
    });

    it('should exclude entrances without coordinates', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHitsWithMissingCoords,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=geojson')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const geojson = JSON.parse(res.text);
          should(geojson.features).have.length(1);
          should(geojson.features[0].properties.name).equal('Cave A');
          return done();
        });
    });

    it('should produce valid empty FeatureCollection for empty result set', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [],
        found: 0,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=geojson')
        .send({ query: 'test', entity: 'entrances' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const geojson = JSON.parse(res.text);
          should(geojson.type).equal('FeatureCollection');
          should(geojson.features).be.an.Array();
          should(geojson.features).have.length(0);
          return done();
        });
    });

    it('should filter and alias fields when columns and columnsName are provided', (done) => {
      const SearchService = require('../../../../api/services/SearchService');
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: entranceHits,
        found: 2,
      });

      supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export?format=geojson')
        .send({
          query: 'test',
          entity: 'entrances',
          columns: ['name', 'country'],
          columnsName: ['Nom', 'Pays'],
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const geojson = JSON.parse(res.text);
          const props = geojson.features[0].properties;
          // Aliased fields present
          should(props).have.property('Nom', 'Cave A');
          should(props).have.property('Pays', 'FR');
          // url always present
          should(props).have.property('url');
          // Original keys and unselected fields absent
          should(props).not.have.property('name');
          should(props).not.have.property('country');
          should(props).not.have.property('altitude');
          should(props).not.have.property('isSensitive');
          return done();
        });
    });
  });
});
