const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('History restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/histories/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/histories/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing history', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/histories/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted history', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/histories/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted history', async () => {
      const history = await THistory.create({
        isDeleted: true,
        author: 1,
        entrance: 1,
        language: 'eng',
      }).fetch();

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/histories/${history.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await THistory.findOne(history.id);
      restored.isDeleted.should.be.false();

      await THistory.destroyOne(history.id);
    });
  });
});
