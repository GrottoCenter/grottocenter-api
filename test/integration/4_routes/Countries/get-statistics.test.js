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
  });
});
