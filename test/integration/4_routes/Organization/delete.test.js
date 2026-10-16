const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const deleteIsPermanentCases = require('../../deleteIsPermanentCases');
const {
  ATTACH_DOCUMENT_HISTO_TRIGGER,
  DETACH_DOCUMENT_HISTO_TRIGGER,
} = require('../../../customSQL');

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

    it('should drop authorship links when permanently deleting without a merge target', async () => {
      const org = await TGrotto.create({ author: 1, isDeleted: true }).fetch();

      // Documents outside any Collection: the organization payload replaces its
      // document list with Collection ancestors, so reading the authorship from
      // it sees nothing and leaves rows that violate the FK on t_grotto.
      const docs = await TDocument.createEach([
        { author: 1, type: 1 },
        { author: 1, type: 1 },
      ]).fetch();
      const docIds = docs.map((d) => d.id);
      await JDocumentGrottoAuthor.createEach(
        docIds.map((id) => ({ document: id, grotto: org.id }))
      );

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${org.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(await TGrotto.findOne(org.id)).be.undefined();
      should(await JDocumentGrottoAuthor.find({ grotto: org.id })).have.length(
        0
      );
      // The documents themselves are only uncredited, not deleted.
      should(await TDocument.find({ id: docIds })).have.length(2);

      await TDocument.destroy({ id: docIds });
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

    it('should hand over every authored document when merging, past the preview cap', async () => {
      const targetOrg = await TGrotto.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1, isDeleted: true }).fetch();

      // More than the 10-document preview the organization payload carries: the
      // merge must read the authorship association uncapped, or the documents
      // past the cap are wiped rather than handed over.
      const docs = await TDocument.createEach(
        Array.from({ length: 12 }, () => ({ author: 1, type: 1 }))
      ).fetch();
      const docIds = docs.map((d) => d.id);

      await JDocumentGrottoAuthor.createEach(
        docIds.map((id) => ({ document: id, grotto: org.id }))
      );
      // Already shared with the survivor, so re-adding it would collide on the
      // (id_document, id_grotto) primary key.
      const sharedDocId = docIds[0];
      await JDocumentGrottoAuthor.create({
        document: sharedDocId,
        grotto: targetOrg.id,
      });

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/organizations/${org.id}?isPermanent=true&entityId=${targetOrg.id}`
        )
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(await TGrotto.findOne(org.id)).be.undefined();
      should(await JDocumentGrottoAuthor.find({ grotto: org.id })).have.length(
        0
      );

      // All 12 authorship links survive on the survivor, the shared one exactly
      // once. Reading the capped preview instead would leave only 10.
      const survivorLinks = await JDocumentGrottoAuthor.find({
        grotto: targetOrg.id,
      });
      should(survivorLinks).have.length(12);
      should(survivorLinks.map((r) => r.document).sort()).deepEqual(
        [...docIds].sort()
      );

      await JDocumentGrottoAuthor.destroy({ document: docIds });
      await TDocument.destroy({ id: docIds });
      await TGrotto.destroy({ id: targetOrg.id });
    });

    // Each geo junction table references t_grotto: a row left behind makes the
    // hard delete fail with an FK violation in production (#1783). The test
    // database has no foreign keys, so the orphan rows are what we check.
    const GEO_JUNCTIONS = [
      { model: () => JOrganizationMassif, field: 'massif' },
      { model: () => JOrganizationCountry, field: 'country' },
      { model: () => JOrganizationRegion, field: 'region' },
    ];

    it('should drop geo associations when permanently deleting without a merge target', async () => {
      const org = await TGrotto.create({ author: 1, isDeleted: true }).fetch();
      await JOrganizationMassif.create({
        grotto: org.id,
        massif: 1,
        author: 1,
      });
      await JOrganizationCountry.create({
        grotto: org.id,
        country: 'FR',
        author: 1,
      });
      await JOrganizationRegion.create({
        grotto: org.id,
        region: 'FR-01',
        author: 1,
      });

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/organizations/${org.id}?isPermanent=true`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(await TGrotto.findOne(org.id)).be.undefined();
      await Promise.all(
        GEO_JUNCTIONS.map(async ({ model }) =>
          should(await model().find({ grotto: org.id })).have.length(0)
        )
      );
    });

    it('should hand geo associations over to the merge target', async () => {
      const targetOrg = await TGrotto.create({ author: 1 }).fetch();
      const org = await TGrotto.create({ author: 1, isDeleted: true }).fetch();

      // Massif 1 and France are shared with the survivor, to exercise the
      // dedup against the (id_grotto, id_<geo>) unique constraints; massif 2,
      // Spain and FR-01 belong to the deleted org only.
      await JOrganizationMassif.createEach([
        { grotto: org.id, massif: 1, author: 1 },
        { grotto: org.id, massif: 2, author: 1 },
        { grotto: targetOrg.id, massif: 1, author: 1 },
      ]);
      await JOrganizationCountry.createEach([
        { grotto: org.id, country: 'FR', author: 1 },
        { grotto: org.id, country: 'ES', author: 3 },
        { grotto: targetOrg.id, country: 'FR', author: 1 },
      ]);
      await JOrganizationRegion.create({
        grotto: org.id,
        region: 'FR-01',
        author: 3,
      });

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/organizations/${org.id}?isPermanent=true&entityId=${targetOrg.id}`
        )
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(await TGrotto.findOne(org.id)).be.undefined();

      const expected = {
        massif: [1, 2],
        country: ['ES', 'FR'],
        region: ['FR-01'],
      };
      await Promise.all(
        GEO_JUNCTIONS.map(async ({ model, field }) => {
          should(await model().find({ grotto: org.id })).have.length(0);
          const survivorRows = await model().find({ grotto: targetOrg.id });
          should(survivorRows.map((r) => r[field]).sort()).deepEqual(
            expected[field]
          );
        })
      );

      // Handed-over rows keep their original author.
      const spain = await JOrganizationCountry.findOne({
        grotto: targetOrg.id,
        country: 'ES',
      });
      should(spain.author).equal(3);

      await Promise.all(
        GEO_JUNCTIONS.map(({ model }) =>
          model().destroy({ grotto: targetOrg.id })
        )
      );
      await TGrotto.destroy({ id: targetOrg.id });
    });

    describe('Documents edited or held by the organization (#1757)', () => {
      const reviewedAt = new Date('2021-03-04T05:06:07Z');

      before(() =>
        sails.getDatastore().sendNativeQuery(ATTACH_DOCUMENT_HISTO_TRIGGER)
      );
      after(() =>
        sails.getDatastore().sendNativeQuery(DETACH_DOCUMENT_HISTO_TRIGGER)
      );

      // The t_document update trigger copies the old row into h_document,
      // keyed by (id, date_reviewed). A history row already holding the
      // document's current review date makes any update that leaves
      // date_reviewed untouched collide on that key.
      const createDocumentWithHistory = async (fields) => {
        const doc = await TDocument.create({
          author: 1,
          type: 1,
          dateInscription: new Date('2020-01-01T00:00:00Z'),
          dateReviewed: reviewedAt,
          ...fields,
        }).fetch();
        await sails
          .getDatastore()
          .sendNativeQuery(
            'INSERT INTO h_document (id, date_reviewed, id_author) VALUES ($1, $2, 1)',
            [doc.id, reviewedAt]
          );
        return doc;
      };

      const deletePermanently = (orgId, query = '') =>
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/organizations/${orgId}?isPermanent=true${query}`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

      const historyOf = async (docId) =>
        (
          await sails
            .getDatastore()
            .sendNativeQuery(
              'SELECT id_editor, id_library FROM h_document WHERE id = $1 ORDER BY date_reviewed',
              [docId]
            )
        ).rows;

      it('should hand the documents over to the merge target despite an existing history row', async () => {
        const targetOrg = await TGrotto.create({ author: 1 }).fetch();
        const org = await TGrotto.create({ author: 1 }).fetch();
        const edited = await createDocumentWithHistory({ editor: org.id });
        const held = await createDocumentWithHistory({ library: org.id });

        await deletePermanently(org.id, `&entityId=${targetOrg.id}`).expect(
          200
        );

        should((await TDocument.findOne(edited.id)).editor).equal(targetOrg.id);
        should((await TDocument.findOne(held.id)).library).equal(targetOrg.id);
        // The reassignment is historized next to the existing row, and the
        // history follows the organization into the merge target.
        should(await historyOf(edited.id)).deepEqual([
          { id_editor: null, id_library: null },
          { id_editor: targetOrg.id, id_library: null },
        ]);
        should(await historyOf(held.id)).deepEqual([
          { id_editor: null, id_library: null },
          { id_editor: null, id_library: targetOrg.id },
        ]);

        await TDocument.destroy({ id: [edited.id, held.id] });
        await TGrotto.destroy({ id: targetOrg.id });
      });

      it('should reassign a document both edited and held by the organization', async () => {
        const targetOrg = await TGrotto.create({ author: 1 }).fetch();
        const org = await TGrotto.create({ author: 1 }).fetch();
        const doc = await createDocumentWithHistory({
          editor: org.id,
          library: org.id,
        });

        await deletePermanently(org.id, `&entityId=${targetOrg.id}`).expect(
          200
        );

        const reassigned = await TDocument.findOne(doc.id);
        should(reassigned.editor).equal(targetOrg.id);
        should(reassigned.library).equal(targetOrg.id);

        await TDocument.destroy({ id: doc.id });
        await TGrotto.destroy({ id: targetOrg.id });
      });

      it('should clear editor and library without a merge target', async () => {
        const org = await TGrotto.create({ author: 1 }).fetch();
        const doc = await createDocumentWithHistory({
          editor: org.id,
          library: org.id,
        });

        await deletePermanently(org.id).expect(200);

        const cleared = await TDocument.findOne(doc.id);
        should(cleared.editor).be.null();
        should(cleared.library).be.null();
        // Historized once, and no history row still points at the deleted
        // organization.
        should(await historyOf(doc.id)).deepEqual([
          { id_editor: null, id_library: null },
          { id_editor: null, id_library: null },
        ]);

        await TDocument.destroy({ id: doc.id });
      });
    });
  });

  deleteIsPermanentCases({
    getToken: () => moderatorToken,
    getModel: () => TGrotto,
    createEntity: () => TGrotto.create({ author: 1 }).fetch(),
    deleteUrl: (id) => `/api/v1/organizations/${id}`,
    findEntity: (id) => TGrotto.findOne(id),
    observe: 'notification',
  });
});
