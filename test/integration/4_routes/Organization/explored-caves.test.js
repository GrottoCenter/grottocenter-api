const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Organization explored caves features', () => {
  let userToken;
  let userId;
  let moderatorToken;
  let adminToken;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
    const tokenData = await AuthTokenService.getUserToken();
    userId = tokenData.id;
  }).timeout(4000);

  describe('Add explored cave', () => {
    it('should return 403 when user is not a member, moderator or admin', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/caves/1/organizations/1')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403);
    });

    it('should return 404 when cave does not exist', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/caves/999999/organizations/1')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return 404 when organization does not exist', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${cave.id}/organizations/999999`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should add cave to organization as admin', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1 }).fetch();

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${cave.id}/organizations/${org.id}`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TGrotto.findOne(org.id).populate('exploredCaves');
      should(updated.exploredCaves).have.length(1);
      should(updated.exploredCaves[0].id).equal(cave.id);
    });

    it('should add cave to organization as moderator', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1 }).fetch();

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${cave.id}/organizations/${org.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TGrotto.findOne(org.id).populate('exploredCaves');
      should(updated.exploredCaves).have.length(1);
    });

    it('should add cave to organization as member', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1 }).fetch();

      await JGrottoCaver.create({
        grotto: org.id,
        caver: userId,
      });

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${cave.id}/organizations/${org.id}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TGrotto.findOne(org.id).populate('exploredCaves');
      should(updated.exploredCaves).have.length(1);
    });

    it('should return 400 when cave is already explored by organization', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1 }).fetch();

      await TGrotto.addToCollection(org.id, 'exploredCaves', cave.id);

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${cave.id}/organizations/${org.id}`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });
  });

  describe('Remove explored cave', () => {
    it('should return 403 when user is not a member, moderator or admin', async () => {
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/caves/1/organizations/1')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403);
    });

    it('should return 404 when cave does not exist', async () => {
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/caves/999999/organizations/1')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return 404 when organization does not exist', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${cave.id}/organizations/999999`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should return 400 when organization is not exploring the cave', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1 }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${cave.id}/organizations/${org.id}`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400);
    });

    it('should remove cave from organization as admin', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1 }).fetch();

      await TGrotto.addToCollection(org.id, 'exploredCaves', cave.id);

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${cave.id}/organizations/${org.id}`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TGrotto.findOne(org.id).populate('exploredCaves');
      should(updated.exploredCaves).have.length(0);
    });

    it('should remove cave from organization as moderator', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1 }).fetch();

      await TGrotto.addToCollection(org.id, 'exploredCaves', cave.id);

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${cave.id}/organizations/${org.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TGrotto.findOne(org.id).populate('exploredCaves');
      should(updated.exploredCaves).have.length(0);
    });

    it('should remove cave from organization as member', async () => {
      const cave = await TCave.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1 }).fetch();

      await JGrottoCaver.create({
        grotto: org.id,
        caver: userId,
      });

      await TGrotto.addToCollection(org.id, 'exploredCaves', cave.id);

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/caves/${cave.id}/organizations/${org.id}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TGrotto.findOne(org.id).populate('exploredCaves');
      should(updated.exploredCaves).have.length(0);
    });
  });
});
