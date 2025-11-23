const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Comment restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/comments/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/comments/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing comment', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/comments/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted comment', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/comments/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted comment', async () => {
      const comment = await TComment.create({
        isDeleted: true,
        author: 1,
        entrance: 1,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/comments/${comment.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await TComment.findOne(comment.id);
      restored.isDeleted.should.be.false();

      await TComment.destroyOne(comment.id);
    });
  });
});
