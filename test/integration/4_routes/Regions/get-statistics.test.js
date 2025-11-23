const supertest = require('supertest');
const should = require('should');

describe('Region statistics features', () => {
  describe('get-statistics', () => {
    it('should return code 404 on empty country', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries//regions/01/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 404 on empty region', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/FR/regions//statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return 404 for non-existent region', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/XX/regions/99/statistics')
        .set('Accept', 'application/json')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          should(res.body.message).containEql('Region XX-99 not found');
          return done();
        });
    });

    it('should return statistics for valid region', (done) => {
      // Using FR-01 which exists in fixtures
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/FR/regions/01/statistics')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          const { body: stats } = res;
          should(stats).have.property('nb_massifs');
          should(stats).have.property('nb_caves');
          should(stats).have.property('nb_networks');
          should(stats).have.property('cave_with_max_depth');
          should(stats).have.property('cave_with_max_length');
          should(stats).have.property('diving_caves');
          should(stats).have.property('avg');
          should(stats.avg).have.property('avg_depth');
          should(stats.avg).have.property('avg_length');
          should(stats).have.property('total_length');
          should(stats.total_length).have.property('value');
          should(stats.total_length).have.property('nb_data');

          return done();
        });
    });

    it('should handle invalid country format', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/INVALID/regions/01/statistics')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should handle invalid region format', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/FR/regions/INVALID/statistics')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should handle numeric region codes', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/US/regions/01/statistics')
        .set('Accept', 'application/json')
        .expect(404, done); // US-01 doesn't exist in fixtures
    });

    it('should handle special characters in parameters', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/FR/regions/01%20/statistics')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
