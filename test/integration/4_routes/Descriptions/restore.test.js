const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Description restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/descriptions/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/descriptions/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing description', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/descriptions/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted description', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/descriptions/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted description', async () => {
      const desc = await TDescription.create({
        isDeleted: true,
        author: 1,
        entrance: 1,
        language: 'eng',
      }).fetch();

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/descriptions/${desc.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await TDescription.findOne(desc.id);
      restored.isDeleted.should.be.false();

      await TDescription.destroyOne(desc.id);
    });
  });
});
