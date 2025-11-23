const supertest = require('supertest');

describe('Comment get snapshots features', () => {
  describe('GET /api/v1/comments/:id/snapshots', () => {
    it('should return 404 on non-existing comment', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/comments/987654321/snapshots')
        .expect(404, done);
    });

    it('should return 404 when comment has no snapshots', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/comments/1/snapshots')
        .expect(404, done);
    });
  });
});
