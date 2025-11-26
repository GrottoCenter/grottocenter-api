const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver explored caves features', () => {
  let userToken;
  let userId;
  let moderatorId;
  let testCave;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const tokenData = await AuthTokenService.getUserToken();
    userId = tokenData.id;

    const moderatorTokenData = await AuthTokenService.getModeratorToken();
    moderatorId = moderatorTokenData.id;

    testCave = await TCave.create({
      author: userId,
      dateInscription: new Date(),
      dateReviewed: new Date(),
    }).fetch();
  });

  after(async () => {
    if (testCave) await TCave.destroyOne({ id: testCave.id });
  });

  describe('PUT /api/v1/caves/:caveId/cavers/:caverId', () => {
    it('should return 401 when not authenticated', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${testCave.id}/cavers/${userId}`)
        .expect(401, done);
    });

    it('should return 403 when trying to add explored cave to another user', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${testCave.id}/cavers/${moderatorId}`)
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing cave', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/987654321/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(404, done);
    });

    it('should return 204 and add explored cave to own profile', async () => {
      const initialCaver =
        await TCaver.findOne(userId).populate('exploredCaves');
      const initialCount = initialCaver.exploredCaves.length;

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${testCave.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(204);

      const updatedCaver =
        await TCaver.findOne(userId).populate('exploredCaves');
      should(updatedCaver.exploredCaves.length).be.greaterThan(initialCount);
    });

    it('should return 204 when moderator adds explored cave to another user', async () => {
      const moderatorToken =
        await AuthTokenService.getRawBearerModeratorToken();
      await supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${testCave.id}/cavers/${moderatorId}`)
        .set('Authorization', moderatorToken)
        .expect(204);
    });
  });

  describe('DELETE /api/v1/caves/:caveId/cavers/:caverId', () => {
    it('should return 401 when not authenticated', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${testCave.id}/cavers/${userId}`)
        .expect(401, done);
    });

    it('should return 403 when trying to remove explored cave from another user', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${testCave.id}/cavers/${moderatorId}`)
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing cave', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/987654321/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(404, done);
    });

    it('should return 204 and remove explored cave', async () => {
      const initialCaver =
        await TCaver.findOne(userId).populate('exploredCaves');
      const initialCount = initialCaver.exploredCaves.length;

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${testCave.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(204);

      const updatedCaver =
        await TCaver.findOne(userId).populate('exploredCaves');
      should(updatedCaver.exploredCaves.length).be.lessThan(initialCount);
    });

    it('should return 204 when moderator removes explored cave from another user', async () => {
      const moderatorToken =
        await AuthTokenService.getRawBearerModeratorToken();
      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${testCave.id}/cavers/${moderatorId}`)
        .set('Authorization', moderatorToken)
        .expect(204);
    });
  });
});
