const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Cave restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/caves/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/caves/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing cave', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/caves/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted cave', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/caves/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted cave', async () => {
      const cave = await TCave.create({
        isDeleted: true,
        author: 1,
        reviewer: 1,
      }).fetch();
      await TName.create({
        cave: cave.id,
        name: 'Test Cave',
        language: 'eng',
        isMain: true,
        author: 1,
      });

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/caves/${cave.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await TCave.findOne(cave.id);
      restored.isDeleted.should.be.false();

      await TName.destroy({ cave: cave.id });
      await TCave.destroyOne(cave.id);
    });
  });
});
