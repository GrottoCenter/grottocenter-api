const supertest = require('supertest');

describe('Massif statistics features', () => {
  describe('get-statistics', () => {
    it('should return code 404', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/entrances/with-quality/countries/')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });
});
