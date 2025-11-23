const supertest = require('supertest');

describe('Rigging get snapshots features', () => {
  describe('GET /api/v1/riggings/:id/snapshots', () => {
    it('should return 404 on non-existing rigging', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/riggings/987654321/snapshots')
        .expect(404, done);
    });

    it('should return 404 when rigging has no snapshots', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/riggings/1/snapshots')
        .expect(404, done);
    });
  });
});
