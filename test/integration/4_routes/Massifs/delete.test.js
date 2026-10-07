const supertest = require('supertest');
const should = require('should');
const sinon = require('sinon');
const AuthTokenService = require('../../AuthTokenService');

describe('Massif features', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/massifs/1')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 404 when massif does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/massifs/999999')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should soft delete a massif', async () => {
      const massif = await TMassif.create({
        author: 1,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/massifs/${massif.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
    });

    it('should soft delete with redirectTo', async () => {
      const massif = await TMassif.create({
        author: 1,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/massifs/${massif.id}?entityId=1`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
      should(res.body.redirectTo).equal(1);
    });

    it('should handle already deleted massif', async () => {
      const massif = await TMassif.create({
        author: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/massifs/${massif.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should permanently delete a massif', async () => {
      const massif = await TMassif.create({
        author: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/massifs/${massif.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TMassif.findOne(massif.id);
      should(deleted).be.undefined();
    });

    it('should permanently delete and merge into another massif', async () => {
      const targetMassif = await TMassif.create({
        author: 1,
      }).fetch();

      const massif = await TMassif.create({
        author: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/massifs/${massif.id}?isPermanent=true&entityId=${targetMassif.id}`
        )
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TMassif.findOne(massif.id);
      should(deleted).be.undefined();
    });

    describe('Permanent delete of a massif referenced elsewhere', () => {
      // The test schema has no foreign keys, so these tests check that every
      // table referencing t_massif is cleared rather than reproducing the 23503.
      // Fixtures used as link targets: guidelines 4 and 5, grottos 1 and 2,
      // document 1, caver 1.
      const DOCUMENT_ID = 1;
      const H_DOCUMENT_ID = 999001;
      let NameService;
      let MassifService;

      before(async () => {
        // Resolved after the Sails lift so the stubs hit the instances the
        // controller uses.
        /* eslint-disable global-require */
        NameService = require('../../../../api/services/NameService');
        MassifService = require('../../../../api/services/MassifService');
        /* eslint-enable global-require */
        // The test schema has no soft-delete trigger on t_massif, so a DELETE
        // always hard-deletes. Attach the production one (histo_delete() is
        // created by test/customSQL.js) so a DELETE on a live row soft-deletes.
        await CommonService.query(
          `CREATE OR REPLACE TRIGGER histo_delete_massif BEFORE DELETE ON t_massif
           FOR EACH ROW EXECUTE PROCEDURE histo_delete()`
        );
      });

      after(async () => {
        await CommonService.query(
          'DROP TRIGGER IF EXISTS histo_delete_massif ON t_massif'
        );
      });

      const createLinkedMassif = async ({ isDeleted = true } = {}) => {
        const massif = await TMassif.create({
          author: 1,
          isDeleted,
        }).fetch();
        await TName.create({
          name: 'Massif to purge',
          isMain: true,
          author: 1,
          language: 'fra',
          massif: massif.id,
        });
        await JGuidelineMassif.create({ guideline: 4, massif: massif.id });
        await JOrganizationMassif.create({
          grotto: 1,
          massif: massif.id,
          author: 1,
        });
        await TMassif.addToCollection(massif.id, 'subscribedCavers', [1]);
        await TDocument.updateOne(DOCUMENT_ID).set({ massif: massif.id });
        await CommonService.query(
          `INSERT INTO h_document (id, date_reviewed, is_validated, id_massif)
           VALUES ($1, now(), true, $2)`,
          [H_DOCUMENT_ID, massif.id]
        );
        return massif;
      };

      const permanentDelete = (id, query = '') =>
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/massifs/${id}?isPermanent=true${query}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

      const linksOf = async (massifId) => ({
        guidelines: (await JGuidelineMassif.find({ massif: massifId }))
          .map((l) => l.guideline)
          .sort(),
        organizations: (await JOrganizationMassif.find({ massif: massifId }))
          .map((l) => l.grotto)
          .sort(),
      });

      afterEach(async () => {
        sinon.restore();
        await TDocument.updateOne(DOCUMENT_ID).set({ massif: null });
        await CommonService.query('DELETE FROM h_document WHERE id = $1', [
          H_DOCUMENT_ID,
        ]);
      });

      it('should clear guideline, organization and document links without a merge target', async () => {
        const massif = await createLinkedMassif();

        await permanentDelete(massif.id).expect(200);

        should(await TMassif.findOne(massif.id)).be.undefined();
        should(await linksOf(massif.id)).eql({
          guidelines: [],
          organizations: [],
        });
        should((await TDocument.findOne(DOCUMENT_ID)).massif).be.null();
        const hDocument = await CommonService.query(
          'SELECT id_massif FROM h_document WHERE id = $1',
          [H_DOCUMENT_ID]
        );
        should(hDocument.rows).eql([{ id_massif: null }]);
        should(await TName.count({ massif: massif.id })).equal(0);
      });

      it('should move guideline, organization and document links to the merge target, dropping duplicates', async () => {
        const target = await TMassif.create({ author: 1 }).fetch();
        // Target already covered by guideline 4 and grotto 1: those rows must
        // not be duplicated. Guideline 5 / grotto 2 are moved over.
        await JGuidelineMassif.create({ guideline: 4, massif: target.id });
        await JOrganizationMassif.create({
          grotto: 1,
          massif: target.id,
          author: 1,
        });
        const massif = await createLinkedMassif();
        await JGuidelineMassif.create({ guideline: 5, massif: massif.id });
        await JOrganizationMassif.create({
          grotto: 2,
          massif: massif.id,
          author: 1,
        });

        await permanentDelete(massif.id, `&entityId=${target.id}`).expect(200);

        should(await TMassif.findOne(massif.id)).be.undefined();
        should(await linksOf(massif.id)).eql({
          guidelines: [],
          organizations: [],
        });
        should(await linksOf(target.id)).eql({
          guidelines: [4, 5],
          organizations: [1, 2],
        });
        should((await TDocument.findOne(DOCUMENT_ID)).massif).equal(target.id);
        const hDocument = await CommonService.query(
          'SELECT id_massif FROM h_document WHERE id = $1',
          [H_DOCUMENT_ID]
        );
        should(hDocument.rows).eql([{ id_massif: target.id }]);
      });

      it('should roll back every step when the permanent delete fails', async () => {
        const massif = await createLinkedMassif();
        sinon
          .stub(NameService, 'permanentDelete')
          .rejects(new Error('simulated failure'));

        await permanentDelete(massif.id).expect(500);

        should(await TMassif.findOne(massif.id)).not.be.undefined();
        should(await linksOf(massif.id)).eql({
          guidelines: [4],
          organizations: [1],
        });
        should((await TDocument.findOne(DOCUMENT_ID)).massif).equal(massif.id);
        const withSubs = await TMassif.findOne(massif.id).populate(
          'subscribedCavers'
        );
        should(withSubs.subscribedCavers.map((c) => c.id)).eql([1]);
        should(await TName.count({ massif: massif.id })).equal(1);
      });

      it('should permanently delete an active massif in one request', async () => {
        const massif = await createLinkedMassif({ isDeleted: false });

        const res = await permanentDelete(massif.id).expect(200);

        should(res.body.isDeleted).be.true();
        should(await TMassif.findOne(massif.id)).be.undefined();
        should(await linksOf(massif.id)).eql({
          guidelines: [],
          organizations: [],
        });
      });

      it('should leave an active massif untouched when the permanent delete fails', async () => {
        const target = await TMassif.create({ author: 1 }).fetch();
        const massif = await createLinkedMassif({ isDeleted: false });
        sinon
          .stub(NameService, 'permanentDelete')
          .rejects(new Error('simulated failure'));
        const deleteInSearch = sinon.spy(MassifService, 'deleteInSearch');

        await permanentDelete(massif.id, `&entityId=${target.id}`).expect(500);

        const unchanged = await TMassif.findOne(massif.id);
        should(unchanged.isDeleted).be.false();
        should(unchanged.redirectTo).be.null();
        should(await linksOf(massif.id)).eql({
          guidelines: [4],
          organizations: [1],
        });
        should(await linksOf(target.id)).eql({
          guidelines: [],
          organizations: [],
        });
        should(deleteInSearch.called).be.false();
      });

      ['false', '0'].forEach((value) => {
        it(`should only soft delete when isPermanent=${value}`, async () => {
          const massif = await TMassif.create({ author: 1 }).fetch();

          await supertest(sails.hooks.http.app)
            .delete(`/api/v1/massifs/${massif.id}?isPermanent=${value}`)
            .set('Authorization', moderatorToken)
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json')
            .expect(200);

          const softDeleted = await TMassif.findOne(massif.id);
          should(softDeleted).not.be.undefined();
          should(softDeleted.isDeleted).be.true();
        });
      });
    });
  });
});
