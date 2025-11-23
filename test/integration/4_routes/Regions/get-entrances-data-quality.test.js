const supertest = require('supertest');
const should = require('should');

describe('Region entrances data quality features', () => {
  describe('get-entrances-data-quality', () => {
    it('should return code 404 on empty country', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries//regions/01')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 404 on empty region', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/FR/regions/')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 for non-existent region', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/XX/regions/99')
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Region XX-99 not found');
          return done();
        });
    });

    it('should return data for valid region', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/FR/regions/01')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body).have.property('quality');
          should(res.body).have.property('totalCount');
          should(res.body).have.property('totalPages');
          return done();
        });
    });

    it('should handle limit parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/FR/regions/01?limit=10')
        .set('Accept', 'application/json')
        .expect(200, done);
    });

    it('should handle offset parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/FR/regions/01?offset=5')
        .set('Accept', 'application/json')
        .expect(404, done); // Still 404 due to no entrances
    });

    it('should handle both limit and offset parameters', (done) => {
      supertest(sails.hooks.http.app)
        .get(
          '/api/v1/entrances/with-quality/countries/FR/regions/01?limit=20&offset=10'
        )
        .set('Accept', 'application/json')
        .expect(404, done); // Still 404 due to no entrances
    });

    it('should handle invalid limit parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get(
          '/api/v1/entrances/with-quality/countries/FR/regions/01?limit=invalid'
        )
        .set('Accept', 'application/json')
        .expect(404, done); // Still 404 due to no entrances
    });

    it('should handle invalid offset parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get(
          '/api/v1/entrances/with-quality/countries/FR/regions/01?offset=invalid'
        )
        .set('Accept', 'application/json')
        .expect(404, done); // Still 404 due to no entrances
    });

    it('should handle negative offset parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/FR/regions/01?offset=-5')
        .set('Accept', 'application/json')
        .expect(200, done);
    });

    it('should handle very large limit parameter', (done) => {
      supertest(sails.hooks.http.app)
        .get(
          '/api/v1/entrances/with-quality/countries/FR/regions/01?limit=9999'
        )
        .set('Accept', 'application/json')
        .expect(200, done);
    });

    it('should handle special characters in region code', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/FR/regions/01%20')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
