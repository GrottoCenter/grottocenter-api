const supertest = require('supertest');

describe('History get snapshots features', () => {
  describe('GET /api/v1/histories/:id/snapshots', () => {
    it('should return 404 on non-existing history', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/histories/987654321/snapshots')
        .expect(404, done);
    });

    it('should return 404 when history has no snapshots', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/histories/1/snapshots')
        .expect(404, done);
    });
  });
});
