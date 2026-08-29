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

    it('should soft delete when isPermanent=false (string)', async () => {
      const org = await TGrotto.create({
        author: 1,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${org.id}?isPermanent=false`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
      // The organization must still exist in the database (soft delete only).
      const still = await TGrotto.findOne(org.id);
      should(still).not.be.undefined();
    });

    it('should soft delete when isPermanent=0', async () => {
      const org = await TGrotto.create({
        author: 1,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${org.id}?isPermanent=0`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
      // The row must survive: `isDeleted` alone proves nothing here, since the
      // soft-delete pass sets it before the permanent branch would run.
      const still = await TGrotto.findOne(org.id);
      should(still).not.be.undefined();
    });

    it('should permanently delete an organization', async () => {
      const org = await TGrotto.create({
        author: 1,
        isDeleted: true,
      }).fetch();

      const cave = await TCave.create({ author: 1 }).fetch();
      await JGrottoCaveExplorer.create({ cave: cave.id, grotto: org.id });

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${org.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TGrotto.findOne(org.id);
      should(deleted).be.undefined();

      const junctionCaveExplorer = await JGrottoCaveExplorer.find({
        grotto: org.id,
      });
      should(junctionCaveExplorer).have.length(0);
    });

    it('should permanently delete and merge into another organization', async () => {
      const targetOrg = await TGrotto.create({
        author: 1,
      }).fetch();

      const org = await TGrotto.create({
        author: 1,
        isDeleted: true,
      }).fetch();

      // Explored caves are re-pointed to the surviving org, not dropped.
      // `sharedCave` is explored by both to exercise the (id_cave, id_grotto)
      // PK-collision dedup; `onlyCave` is explored only by the deleted org.
      const sharedCave = await TCave.create({ author: 1 }).fetch();
      const onlyCave = await TCave.create({ author: 1 }).fetch();
      await JGrottoCaveExplorer.create({ cave: sharedCave.id, grotto: org.id });
      await JGrottoCaveExplorer.create({
        cave: sharedCave.id,
        grotto: targetOrg.id,
      });
      await JGrottoCaveExplorer.create({ cave: onlyCave.id, grotto: org.id });

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

      // No relationships left pointing at the deleted org.
      const orphaned = await JGrottoCaveExplorer.find({ grotto: org.id });
      should(orphaned).have.length(0);

      // The survivor explores both caves, each exactly once (no PK collision).
      const survivorCaves = await JGrottoCaveExplorer.find({
        grotto: targetOrg.id,
      });
      should(survivorCaves).have.length(2);
      should(survivorCaves.map((r) => r.cave).sort()).deepEqual(
        [sharedCave.id, onlyCave.id].sort()
      );
    });
  });
});
