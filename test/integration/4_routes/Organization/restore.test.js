const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Organization restore features', () => {
  let moderatorToken;
  let userToken;

  before(async () => {
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('POST /api/v1/organizations/:id/restore', () => {
    it('should return 403 for non-moderator', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/organizations/1/restore')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing organization', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/organizations/987654321/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 on non-deleted organization', (done) => {
      supertest(sails.hooks.http.app)
        .post('/api/v1/organizations/1/restore')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 200 and restore deleted organization', async () => {
      const org = await TGrotto.create({
        isDeleted: true,
        author: 1,
        reviewer: 1,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .post(`/api/v1/organizations/${org.id}/restore`)
        .set('Authorization', moderatorToken)
        .expect(200);

      const restored = await TGrotto.findOne(org.id);
      restored.isDeleted.should.be.false();

      await TGrotto.destroyOne(org.id);
    });
  });
});
