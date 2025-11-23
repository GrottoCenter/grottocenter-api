const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Massif restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/massifs/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing massif', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted massif', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/massifs/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted massif', async () => {
      const massif = await TMassif.create({
        isDeleted: true,
        author: 1,
        reviewer: 1,
      }).fetch();
      await TName.create({
        massif: massif.id,
        name: 'Test Massif',
        language: 'eng',
        isMain: true,
        author: 1,
      });

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/massifs/${massif.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await TMassif.findOne(massif.id);
      restored.isDeleted.should.be.false();

      await TName.destroy({ massif: massif.id });
      await TMassif.destroyOne(massif.id);
    });
  });
});
