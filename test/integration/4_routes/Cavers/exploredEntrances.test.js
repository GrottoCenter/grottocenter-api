const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver explored entrances features', () => {
  let userToken;
  let userId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const tokenData = await AuthTokenService.getUserToken();
    userId = tokenData.id;
  });

  describe('PUT /api/v1/cavers/:caverId/entrances/:entranceId', () => {
    const existingEntranceId = 1;

    it('should return 400 on non-existing entrance', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/cavers/${userId}/entrances/987654321`)
        .set('Authorization', userToken)
        .expect(400, done);
    });

    it('should return 204 and add explored entrance', async () => {
      const initialCaver =
        await TCaver.findOne(userId).populate('exploredEntrances');
      const initialCount = initialCaver.exploredEntrances.length;

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/cavers/${userId}/entrances/${existingEntranceId}`)
        .set('Authorization', userToken)
        .expect(204);

      const updatedCaver =
        await TCaver.findOne(userId).populate('exploredEntrances');
      should(updatedCaver.exploredEntrances.length).be.greaterThanOrEqual(
        initialCount
      );

      await TCaver.removeFromCollection(
        userId,
        'exploredEntrances',
        existingEntranceId
      );
    });
  });

  describe('DELETE /api/v1/cavers/:caverId/entrances/:entranceId', () => {
    const existingEntranceId = 1;

    it('should return 400 on non-existing entrance', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/cavers/${userId}/entrances/987654321`)
        .set('Authorization', userToken)
        .expect(400, done);
    });

    it('should return 204 and remove explored entrance', async () => {
      await TCaver.addToCollection(
        userId,
        'exploredEntrances',
        existingEntranceId
      );

      const initialCaver =
        await TCaver.findOne(userId).populate('exploredEntrances');
      const initialCount = initialCaver.exploredEntrances.length;

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/cavers/${userId}/entrances/${existingEntranceId}`)
        .set('Authorization', userToken)
        .expect(204);

      const updatedCaver =
        await TCaver.findOne(userId).populate('exploredEntrances');
      should(updatedCaver.exploredEntrances.length).be.lessThan(initialCount);
    });
  });
});
