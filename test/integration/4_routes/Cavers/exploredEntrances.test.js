const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver explored entrances features', () => {
  let userToken;
  let userId;
  let moderatorToken;
  let moderatorId;
  let testCave;
  let testEntrance;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    const tokenData = await AuthTokenService.getUserToken();
    userId = tokenData.id;

    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    const moderatorTokenData = await AuthTokenService.getModeratorToken();
    moderatorId = moderatorTokenData.id;

    testCave = await TCave.create({
      author: userId,
      dateInscription: new Date(),
      dateReviewed: new Date(),
    }).fetch();

    testEntrance = await TEntrance.create({
      author: userId,
      dateInscription: new Date(),
      latitude: '45.5',
      longitude: '6.5',
      cave: testCave.id,
      geology: 'Q35758',
    }).fetch();
  });

  after(async () => {
    // Clean up junction rows first (FK constraint)
    await sails.sendNativeQuery(
      'DELETE FROM j_caver_entrance_explorer WHERE id_entrance = $1',
      [testEntrance.id]
    );
    if (testEntrance) await TEntrance.destroyOne({ id: testEntrance.id });
    if (testCave) await TCave.destroyOne({ id: testCave.id });
  });

  describe('PUT /api/v1/entrances/:entranceId/cavers/:caverId', () => {
    afterEach(async () => {
      // Clean up any relationship created during tests
      await sails.sendNativeQuery(
        'DELETE FROM j_caver_entrance_explorer WHERE id_entrance = $1',
        [testEntrance.id]
      );
    });

    it('should return 401 when not authenticated', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/entrances/${testEntrance.id}/cavers/${userId}`)
        .expect(401, done);
    });

    it('should return 403 when trying to add explored entrance to another user', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/entrances/${testEntrance.id}/cavers/${moderatorId}`)
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing entrance', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/entrances/987654321/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(404, done);
    });

    it('should return 404 on non-existing caver', (done) => {
      supertest(sails.hooks.http.app)
        .put(`/api/v1/entrances/${testEntrance.id}/cavers/987654321`)
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 204 and add explored entrance to own profile', async () => {
      await supertest(sails.hooks.http.app)
        .put(`/api/v1/entrances/${testEntrance.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(204);

      const caver = await TCaver.findOne(userId).populate('exploredEntrances');
      const found = caver.exploredEntrances.some(
        (e) => e.id === testEntrance.id
      );
      should(found).be.true();
    });

    it('should return 204 when moderator adds explored entrance to another user', async () => {
      await supertest(sails.hooks.http.app)
        .put(`/api/v1/entrances/${testEntrance.id}/cavers/${moderatorId}`)
        .set('Authorization', moderatorToken)
        .expect(204);
    });

    it('should return 409 when relationship already exists', async () => {
      // Create the relationship first
      await sails.sendNativeQuery(
        'INSERT INTO j_caver_entrance_explorer (id_entrance, id_caver) VALUES ($1, $2)',
        [testEntrance.id, userId]
      );

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/entrances/${testEntrance.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(409);
    });
  });

  describe('DELETE /api/v1/entrances/:entranceId/cavers/:caverId', () => {
    beforeEach(async () => {
      // Ensure relationship exists for delete tests
      await sails.sendNativeQuery(
        'INSERT INTO j_caver_entrance_explorer (id_entrance, id_caver) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [testEntrance.id, userId]
      );
      await sails.sendNativeQuery(
        'INSERT INTO j_caver_entrance_explorer (id_entrance, id_caver) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [testEntrance.id, moderatorId]
      );
    });

    afterEach(async () => {
      await sails.sendNativeQuery(
        'DELETE FROM j_caver_entrance_explorer WHERE id_entrance = $1',
        [testEntrance.id]
      );
    });

    it('should return 401 when not authenticated', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${testEntrance.id}/cavers/${userId}`)
        .expect(401, done);
    });

    it('should return 403 when trying to remove explored entrance from another user', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${testEntrance.id}/cavers/${moderatorId}`)
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 on non-existing entrance', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/987654321/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(404, done);
    });

    it('should return 404 on non-existing caver', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${testEntrance.id}/cavers/987654321`)
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should return 404 when relationship does not exist', async () => {
      // Remove the relationship first
      await sails.sendNativeQuery(
        'DELETE FROM j_caver_entrance_explorer WHERE id_entrance = $1 AND id_caver = $2',
        [testEntrance.id, userId]
      );

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${testEntrance.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(404);
    });

    it('should return 204 and remove explored entrance from own profile', async () => {
      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${testEntrance.id}/cavers/${userId}`)
        .set('Authorization', userToken)
        .expect(204);

      const caver = await TCaver.findOne(userId).populate('exploredEntrances');
      const found = caver.exploredEntrances.some(
        (e) => e.id === testEntrance.id
      );
      should(found).be.false();
    });

    it('should return 204 when moderator removes explored entrance from another user', async () => {
      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/entrances/${testEntrance.id}/cavers/${moderatorId}`)
        .set('Authorization', moderatorToken)
        .expect(204);
    });
  });
});
