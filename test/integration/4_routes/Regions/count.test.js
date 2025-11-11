const supertest = require('supertest');

describe('Region features', () => {
  describe('Count', () => {
    it('should return code 404 on empty country', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries//regions/count')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/countries/FR/regions/count')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200, done);
    });
  });
});
