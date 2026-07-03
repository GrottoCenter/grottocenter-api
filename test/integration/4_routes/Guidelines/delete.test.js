const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Guideline delete', () => {
  let userToken;
  let moderatorToken;
  let adminToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/guidelines/1')
        .set('Authorization', userToken)
        .expect(403, done);
    });

    it('should return 404 when guideline does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/guidelines/999999')
        .set('Authorization', moderatorToken)
        .expect(404, done);
    });

    it('should soft delete a guideline', async () => {
      const guideline = await TGuideline.create({
        title: 'Delete Me',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${guideline.id}`)
        .set('Authorization', moderatorToken)
        .expect(200);

      should(res.body.isDeleted).be.true();

      const updated = await TGuideline.findOne(guideline.id);
      should(updated.isDeleted).be.true();

      // Verify that a history snapshot was created capturing the state before deletion
      const snapshots = await HGuideline.find({ t_id: guideline.id });
      should(snapshots.length).equal(1);
      should(snapshots[0].title).equal('Delete Me');
      should(snapshots[0].isDeleted).be.false();
    });

    it('should return 404 when soft deleting an already deleted guideline', async () => {
      const guideline = await TGuideline.create({
        title: 'Already Deleted',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${guideline.id}`)
        .set('Authorization', moderatorToken)
        .expect(404);
    });
  });

  describe('permanent delete', () => {
    it('should return 403 when a moderator requests a permanent delete', async () => {
      const guideline = await TGuideline.create({
        title: 'Moderator Cannot Hard Delete',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${guideline.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .expect(403);

      // The guideline must remain untouched (not even soft-deleted).
      const stillThere = await TGuideline.findOne(guideline.id);
      should(stillThere).be.ok();
      should(stillThere.isDeleted).be.false();

      await TGuideline.destroy({ id: guideline.id }); // cleanup (soft-delete)
    });

    it('should hard delete a guideline along with its history and associations', async () => {
      const guideline = await TGuideline.create({
        title: 'Hard Delete Me',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
      }).fetch();
      await TGuideline.addToCollection(guideline.id, 'countries', ['FR']);
      await TGuideline.addToCollection(guideline.id, 'massifs', [1]);

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${guideline.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .expect(200);

      should(res.body.isDeleted).be.true();

      // The row and all FK-referencing children must be gone.
      const remaining = await TGuideline.findOne(guideline.id);
      should(remaining).be.undefined();

      const snapshots = await HGuideline.find({ t_id: guideline.id });
      should(snapshots.length).equal(0);

      const countryLinks = await sails.sendNativeQuery(
        'SELECT 1 FROM j_guideline_country WHERE id_guideline = $1',
        [guideline.id]
      );
      should(countryLinks.rows.length).equal(0);

      const massifLinks = await sails.sendNativeQuery(
        'SELECT 1 FROM j_guideline_massif WHERE id_guideline = $1',
        [guideline.id]
      );
      should(massifLinks.rows.length).equal(0);
    });

    it('should hard delete a guideline that was already soft-deleted', async () => {
      const guideline = await TGuideline.create({
        title: 'Already Soft Deleted, Now Permanent',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${guideline.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .expect(200);

      const remaining = await TGuideline.findOne(guideline.id);
      should(remaining).be.undefined();
    });

    // The web client sends `?isPermanent=1` (not `=true`); this must hard delete.
    it('should hard delete when isPermanent=1 (the web client encoding)', async () => {
      const guideline = await TGuideline.create({
        title: 'Hard Delete Via isPermanent=1',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${guideline.id}?isPermanent=1`)
        .set('Authorization', adminToken)
        .expect(200);

      const remaining = await TGuideline.findOne(guideline.id);
      should(remaining).be.undefined();
    });

    // An explicit falsy value must NOT trigger a permanent delete.
    it('should treat isPermanent=0 as a soft delete, not a permanent one', async () => {
      const guideline = await TGuideline.create({
        title: 'isPermanent=0 Is Soft',
        author: 3,
        language: 'fra',
        dateInscription: new Date(),
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/guidelines/${guideline.id}?isPermanent=0`)
        .set('Authorization', adminToken)
        .expect(200);

      should(res.body.isDeleted).be.true();

      // The row must still exist (soft-deleted), not be hard-deleted.
      const remaining = await TGuideline.findOne(guideline.id);
      should(remaining).be.ok();
      should(remaining.isDeleted).be.true();

      await TGuideline.destroy({ id: guideline.id }); // cleanup
    });
  });
});
