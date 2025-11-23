const supertest = require('supertest');
const AuthTokenService = require('../AuthTokenService');

describe('Cave Explorer endpoints', () => {
  let agent;
  let adminToken;
  let userToken;
  let caveId;
  let organizationId;
  let memberId;

  before(async () => {
    agent = supertest.agent(sails.hooks.http.app);

    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();

    // Create test cave
    const cave = await TCave.create({
      author: 1, // admin id
      depth: 100,
      length: 500,
    }).fetch();
    caveId = cave.id;

    // Create test organization
    const organization = await TGrotto.create({
      author: 1, // admin id
      city: 'Test City',
    }).fetch();
    organizationId = organization.id;

    // Get member user ID and add to organization
    memberId = 6; // caver1 from fixtures
    await JGrottoCaver.create({
      caver: memberId,
      grotto: organizationId,
    });
  });

  after(async () => {
    await JGrottoCaver.destroy({
      caver: memberId,
      grotto: organizationId,
    });
    await TCave.destroy({ id: caveId });
    await TGrotto.destroy({ id: organizationId });
  });

  describe('PUT /api/v1/caves/:caveId/explorers/:organizationId', () => {
    after(async () => {
      await JGrottoCaveExplorer.destroy({
        cave: caveId,
        grotto: organizationId,
      });
    });

    it('should add organization as cave explorer with admin token', async () => {
      await agent
        .put(`/api/v1/caves/${caveId}/explorers/${organizationId}`)
        .set('Authorization', adminToken)
        .expect(200);
    });

    it('should return 403 with non-member user token', async () => {
      await agent
        .put(`/api/v1/caves/${caveId}/explorers/${organizationId}`)
        .set('Authorization', userToken)
        .expect(403);
    });

    it('should return 401 without token', async () => {
      await agent
        .put(`/api/v1/caves/${caveId}/explorers/${organizationId}`)
        .expect(401);
    });

    it('should return 404 for non-existent cave', async () => {
      await agent
        .put(`/api/v1/caves/99999/explorers/${organizationId}`)
        .set('Authorization', adminToken)
        .expect(404);
    });

    it('should return 404 for non-existent organization', async () => {
      await agent
        .put(`/api/v1/caves/${caveId}/explorers/99999`)
        .set('Authorization', adminToken)
        .expect(404);
    });

    it('should return 400 when relationship already exists', async () => {
      await JGrottoCaveExplorer.create({
        cave: caveId,
        grotto: organizationId,
      });

      await agent
        .put(`/api/v1/caves/${caveId}/explorers/${organizationId}`)
        .set('Authorization', adminToken)
        .expect(400);
    });
  });

  describe('DELETE /api/v1/caves/:caveId/explorers/:organizationId', () => {
    before(async () => {
      await JGrottoCaveExplorer.create({
        cave: caveId,
        grotto: organizationId,
      });
    });

    after(async () => {
      await JGrottoCaveExplorer.destroy({
        cave: caveId,
        grotto: organizationId,
      });
    });

    it('should remove organization as cave explorer with admin token', async () => {
      await agent
        .delete(`/api/v1/caves/${caveId}/explorers/${organizationId}`)
        .set('Authorization', adminToken)
        .expect(200);
    });

    it('should return 403 with non-member user token', async () => {
      await agent
        .delete(`/api/v1/caves/${caveId}/explorers/${organizationId}`)
        .set('Authorization', userToken)
        .expect(403);
    });

    it('should return 401 without token', async () => {
      await agent
        .delete(`/api/v1/caves/${caveId}/explorers/${organizationId}`)
        .expect(401);
    });

    it('should return 404 for non-existent cave', (done) => {
      supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/99999/explorers/${organizationId}`)
        .set('Authorization', adminToken)
        .expect(404)
        .end(done);
    });

    it('should return 400 when relationship does not exist', async () => {
      await JGrottoCaveExplorer.destroy({
        cave: caveId,
        grotto: organizationId,
      });

      await agent
        .delete(`/api/v1/caves/${caveId}/explorers/${organizationId}`)
        .set('Authorization', adminToken)
        .expect(400);
    });
  });
});
