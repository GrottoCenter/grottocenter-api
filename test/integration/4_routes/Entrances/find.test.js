const supertest = require('supertest');
const should = require('should');
const ENTRANCE_PROPERTIES = require('./ENTRANCE_PROPERTIES');
const {
  QUALITY_CATEGORIES,
} = require('../../../../api/utils/computeEntranceDataQuality');

describe('Entrance features', () => {
  describe('find', () => {
    it('should return code 404 for non-existent entrance', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/987654321')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for invalid ID format', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/558_')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for entrance ID 0', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/0')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 404 for negative entrance ID', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/-1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 200 for valid entrance', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: entrance } = res;
          should(entrance).have.properties(ENTRANCE_PROPERTIES);
          should(entrance.name).equal('The entrance with name 11');
          should(entrance.names).not.be.empty();
          should(entrance.author).not.be.empty();
          should(entrance.comments.length).equal(3);
          should(entrance.descriptions.length).equal(1);
          should(entrance.locations.length).equal(2);
          should(entrance.histories.length).equal(1);
          return done();
        });
    });

    it('should return dataQuality with score and categories for entrance with quality data', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/1')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: entrance } = res;
          should(entrance).have.property('dataQuality');
          should(entrance.dataQuality).not.be.null();
          should(entrance.dataQuality).have.property('total');
          should(entrance.dataQuality.total).be.a.Number();
          should(entrance.dataQuality.total).be.greaterThanOrEqual(0);
          should(entrance.dataQuality.total).be.lessThanOrEqual(100);
          should(entrance.dataQuality).have.property('categories');
          const categoryKeys = Object.keys(entrance.dataQuality.categories);
          should(categoryKeys).have.length(7);
          QUALITY_CATEGORIES.forEach((cat) => {
            should(entrance.dataQuality.categories).have.property(cat);
            should(entrance.dataQuality.categories[cat]).be.a.Number();
            should(entrance.dataQuality.categories[cat]).be.greaterThanOrEqual(
              0
            );
            should(entrance.dataQuality.categories[cat]).be.lessThanOrEqual(
              100
            );
          });
          should(entrance.dataQuality).have.property('lastComputedAt');
          return done();
        });
    });

    it('should return dataQuality as null for entrance without quality data', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/4')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: entrance } = res;
          should(entrance).have.property('dataQuality');
          should(entrance.dataQuality).be.null();
          return done();
        });
    });
  });
});
