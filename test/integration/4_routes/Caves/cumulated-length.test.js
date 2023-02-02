const supertest = require('supertest');

describe('Caves features', () => {
  describe('Cumulated length', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/caves/cumulated-length')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200, done);
    });
  });
});
