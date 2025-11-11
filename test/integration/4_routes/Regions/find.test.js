const supertest = require('supertest');
const should = require('should');

const REGION_PROPERTIES = ['id', 'name'];

describe('Region features', () => {
  describe('Find', () => {
    it('should return code 404 on inexisting country', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/INVALID/regions/REGION')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 404 on inexisting region', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/FR/regions/INVALID')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/FR/regions/01')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { body: region } = res;
          should(region).have.properties(REGION_PROPERTIES);
          should(region.id).not.be.empty();
          should(region.name).not.be.empty();
          return done();
        });
    });
  });
});
