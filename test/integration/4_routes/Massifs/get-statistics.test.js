const supertest = require('supertest');

describe('Massif statistics features', () => {
  describe('get-statistics', () => {
    it('should return code 404 for empty massif id', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/massifs//statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should return code 404 for non-existent massif', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/999999/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return statistics for valid massif', async () => {
      await supertest(sails.hooks.http.app)
        .get('/api/v1/massifs/1/statistics')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });
  });
});
