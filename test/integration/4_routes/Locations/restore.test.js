const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Location restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/locations/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/locations/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing location', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/locations/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted location', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/locations/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted location', async () => {
      const location = await TLocation.create({
        isDeleted: true,
        author: 1,
        entrance: 1,
        language: 'eng',
      }).fetch();

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/locations/${location.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await TLocation.findOne(location.id);
      restored.isDeleted.should.be.false();

      await TLocation.destroyOne(location.id);
    });
  });
});
