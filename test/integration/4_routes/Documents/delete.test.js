const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const deleteIsPermanentCases = require('../../deleteIsPermanentCases');

describe('Document delete', () => {
  let userToken;
  let moderatorToken;
  let adminToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Delete', () => {
    it('should return 403 when user is not a moderator', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
      }).fetch();
      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${doc.id}`)
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403);
      await TDocument.destroy({ id: doc.id });
    });

    it('should return 404 when document does not exist', async () => {
      await supertest(sails.hooks.http.app)
        .delete('/api/v1/documents/999999')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('should soft delete a document', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${doc.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
    });

    it('should soft delete with redirectTo', async () => {
      const targetDoc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
      }).fetch();

      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${doc.id}?entityId=${targetDoc.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
      should(res.body.redirectTo).equal(targetDoc.id);
    });

    it('should handle already deleted document', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${doc.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should permanently delete a document', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${doc.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TDocument.findOne(doc.id);
      should(deleted).be.undefined();
    });

    it('should permanently delete and merge into another document', async () => {
      const targetDoc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
      }).fetch();

      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/documents/${doc.id}?isPermanent=true&entityId=${targetDoc.id}`
        )
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TDocument.findOne(doc.id);
      should(deleted).be.undefined();
    });

    it('should permanently delete a document with entrance associations', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
        isDeleted: true,
      }).fetch();

      await TDocument.addToCollection(doc.id, 'entrances', [1]);

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${doc.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TDocument.findOne(doc.id);
      should(deleted).be.undefined();
      const junctions = await JDocumentEntrance.find({ document: doc.id });
      should(junctions).have.length(0);
    });

    it('should permanently delete a non-deleted document with entrance associations (two-step flow)', async () => {
      // Reproduces #1596: non-deleted doc + junction rows + isPermanent in one request
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
        isDeleted: false,
      }).fetch();

      await TDocument.addToCollection(doc.id, 'entrances', [1]);

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${doc.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TDocument.findOne(doc.id);
      should(deleted).be.undefined();
      const junctions = await JDocumentEntrance.find({ document: doc.id });
      should(junctions).have.length(0);
    });

    it('should merge entrance associations when permanently deleting into another document', async () => {
      const targetDoc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
      }).fetch();

      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
        isDeleted: true,
      }).fetch();

      await TDocument.addToCollection(doc.id, 'entrances', [1]);

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/documents/${doc.id}?isPermanent=true&entityId=${targetDoc.id}`
        )
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TDocument.findOne(doc.id);
      should(deleted).be.undefined();
      const sourceJunctions = await JDocumentEntrance.find({
        document: doc.id,
      });
      should(sourceJunctions).have.length(0);
      const targetWithEntrances = await TDocument.findOne(
        targetDoc.id
      ).populate('entrances');
      const entranceIds = targetWithEntrances.entrances.map((e) => e.id);
      should(entranceIds).containEql(1);
    });

    it('should permanently delete a document with bibliographic metadata', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: true,
        isDeleted: true,
      }).fetch();

      await sails.sendNativeQuery(
        `INSERT INTO t_bibliographic_metadata (id_document, oai_identifier, last_update, metadata_status)
         VALUES ($1, $2, NOW(), 'registered')`,
        [doc.id, `oai:grottocenter.org:${doc.id}`]
      );

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${doc.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TDocument.findOne(doc.id);
      should(deleted).be.undefined();
      const { rows } = await sails.sendNativeQuery(
        'SELECT * FROM t_bibliographic_metadata WHERE id_document = $1',
        [doc.id]
      );
      should(rows).have.length(0);
    });
  });

  describe('Permanent delete of a plan with points positioned on it', () => {
    // The test database is built by Waterline, without foreign keys: install
    // the one of sql/9_35_2026_11_03_point_svg_position.sql that a hard delete
    // of a referenced plan would violate.
    before(async () => {
      await sails.sendNativeQuery(`
        ALTER TABLE j_point_document_position
          DROP CONSTRAINT IF EXISTS j_point_document_position_document_fk;
        ALTER TABLE j_point_document_position
          ADD CONSTRAINT j_point_document_position_document_fk
          FOREIGN KEY (id_document) REFERENCES t_document(id) NOT VALID;
      `);
    });

    after(async () => {
      await sails.sendNativeQuery(
        'ALTER TABLE j_point_document_position DROP CONSTRAINT IF EXISTS j_point_document_position_document_fk'
      );
    });

    // The plan is already soft-deleted, as in the other permanent delete
    // tests: the test database has no histo_delete trigger turning the first
    // DELETE into a soft delete.
    const createPositionedPoints = async () => {
      const [plan, section] = await Promise.all(
        [true, false].map((isDeleted) =>
          TDocument.create({
            author: 1,
            type: 13,
            license: 1,
            isValidated: true,
            isDeleted,
          }).fetch()
        )
      );
      const points = await Promise.all([
        TPoint.create({ label: 'On the plan', author: 1 }).fetch(),
        TPoint.create({
          label: 'Deleted, on the plan',
          author: 1,
          isDeleted: true,
        }).fetch(),
      ]);
      const pointIds = points.map((p) => p.id);
      await JPointDocumentPosition.createEach([
        ...pointIds.map((point, i) => ({
          point,
          document: plan.id,
          x: i,
          y: i,
          dateInscription: new Date(),
        })),
        {
          point: pointIds[0],
          document: section.id,
          x: 9,
          y: 9,
          dateInscription: new Date(),
        },
      ]);
      return { plan, section, pointIds };
    };

    const expectOnlyPlanPositionsRemoved = async ({
      plan,
      section,
      pointIds,
    }) => {
      should(await TPoint.count({ id: pointIds })).equal(2);
      should(await JPointDocumentPosition.count({ document: plan.id })).equal(
        0
      );
      const kept = await JPointDocumentPosition.find({ point: pointIds });
      should(kept.map((p) => p.document)).deepEqual([section.id]);
      await JPointDocumentPosition.destroy({ point: pointIds });
      await TPoint.destroy({ id: pointIds });
      await TDocument.destroy({ id: section.id });
    };

    it('removes the positions on it and keeps those on other documents', async () => {
      const seeded = await createPositionedPoints();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${seeded.plan.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(await TDocument.findOne(seeded.plan.id)).be.undefined();
      await expectOnlyPlanPositionsRemoved(seeded);
    });

    it('removes the positions when merging the plan into another document', async () => {
      const seeded = await createPositionedPoints();
      const target = await TDocument.create({
        author: 1,
        type: 13,
        license: 1,
        isValidated: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/documents/${seeded.plan.id}?isPermanent=true&entityId=${target.id}`
        )
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(await TDocument.findOne(seeded.plan.id)).be.undefined();
      should(await JPointDocumentPosition.count({ document: target.id })).equal(
        0
      );
      await expectOnlyPlanPositionsRemoved(seeded);
      await TDocument.destroy({ id: target.id });
    });
  });

  deleteIsPermanentCases({
    getToken: () => adminToken,

    getModeratorToken: () => moderatorToken,
    getModel: () => TDocument,
    createEntity: () =>
      TDocument.create({ author: 1, type: 1, license: 1 }).fetch(),
    deleteUrl: (id) => `/api/v1/documents/${id}`,
    findEntity: (id) => TDocument.findOne(id),
    observe: 'notification',
  });
});
