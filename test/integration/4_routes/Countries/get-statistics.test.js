const supertest = require('supertest');

describe('Country statistics features', () => {
  describe('get-statistics', () => {
    it('should return code 404 for empty country id', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries//statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 404 for non-existent country', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/countries/XX/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return statistics for valid country', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/countries/FR/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should return 200 with zero stats for a country absent from the materialized view', async () => {
      // GB exists in t_country but has no rows in v_country_info.
      // Before this fix, the view-based existence check caused a 404.
      const response = await supertest(sails.hooks.http.app)
        .get('/api/v1/countries/GB/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      response.body.nb_caves.should.equal(0);
    });
  });
});
