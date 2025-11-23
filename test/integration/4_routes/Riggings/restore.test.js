const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Rigging restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/riggings/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/riggings/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing rigging', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/riggings/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted rigging', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/riggings/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted rigging', async () => {
      const rigging = await TRigging.create({
        isDeleted: true,
        author: 1,
        entrance: 1,
        language: 'eng',
      }).fetch();

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/riggings/${rigging.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await TRigging.findOne(rigging.id);
      restored.isDeleted.should.be.false();

      await TRigging.destroyOne(rigging.id);
    });
  });
});
