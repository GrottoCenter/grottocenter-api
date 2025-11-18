const supertest = require('supertest');

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
  });
});
