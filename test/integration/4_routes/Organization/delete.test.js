const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Organization features', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/organizations/1')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 404 when organization does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/organizations/999999')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should soft delete an organization', async () => {
      const org = await TGrotto.create({
        author: 1,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${org.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
    });

    it('should soft delete with redirectTo', async () => {
      const org = await TGrotto.create({
        author: 1,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${org.id}?entityId=1`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
      should(res.body.redirectTo).equal(1);
    });

    it('should handle already deleted organization', async () => {
      const org = await TGrotto.create({
        author: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${org.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should permanently delete an organization', async () => {
      const org = await TGrotto.create({
        author: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${org.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TGrotto.findOne(org.id);
      should(deleted).be.undefined();
    });

    it('should permanently delete and merge into another organization', async () => {
      const targetOrg = await TGrotto.create({
        author: 1,
      }).fetch();

      const org = await TGrotto.create({
        author: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/organizations/${org.id}?isPermanent=true&entityId=${targetOrg.id}`
        )
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TGrotto.findOne(org.id);
      should(deleted).be.undefined();
    });
  });
});
