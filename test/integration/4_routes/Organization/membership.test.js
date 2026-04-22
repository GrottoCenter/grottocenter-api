const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Caver Organization Membership', () => {
  let adminToken;
  let userToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    userToken = await AuthTokenService.getRawBearerUserToken();
  });

  describe('PUT /api/v1/cavers/:caverId/organizations/:organizationId', () => {
    it('should add caver to organization (self)', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/1/organizations/1')
        .set('Authorization', adminToken)
        .expect(200);
    });

    it('should allow admin to add other caver to organization', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/3/organizations/1')
        .set('Authorization', adminToken)
        .expect(200);
    });

    it('should forbid regular user from adding other caver to organization', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/1/organizations/1')
        .set('Authorization', userToken)
        .expect(403);
    });

    it('should return 400 if caver is already member', async () => {
      // First add the caver
      await supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/1/organizations/2')
        .set('Authorization', adminToken)
        .expect(200);

      // Try to add again
      await supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/1/organizations/2')
        .set('Authorization', adminToken)
        .expect(400);
    });

    it('should return 404 if caver not found', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/99999/organizations/1')
        .set('Authorization', adminToken)
        .expect(404);
    });

    it('should return 404 if organization not found', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/1/organizations/99999')
        .set('Authorization', adminToken)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/cavers/:caverId/organizations/:organizationId', () => {
    it('should remove caver from organization (self)', async () => {
      // First add the caver
      await supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/1/organizations/3')
        .set('Authorization', adminToken)
        .expect(200);

      // Then remove
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/1/organizations/3')
        .set('Authorization', adminToken)
        .expect(200);
    });

    it('should allow admin to remove other caver from organization', async () => {
      // First add the caver
      await supertest(sails.hooks.http.app)
        .put('/api/v1/cavers/3/organizations/2')
        .set('Authorization', adminToken)
        .expect(200);

      // Then remove as admin
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/3/organizations/2')
        .set('Authorization', adminToken)
        .expect(200);
    });

    it('should forbid regular user from removing other caver from organization', async () => {
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/1/organizations/1')
        .set('Authorization', userToken)
        .expect(403);
    });

    it('should return 400 if caver is not a member', async () => {
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/cavers/2/organizations/3')
        .set('Authorization', adminToken)
        .expect(400);
    });
  });
});
