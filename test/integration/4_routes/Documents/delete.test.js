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
    // the one of sql/9_33_2026_11_03_point_svg_position.sql that a hard delete
    // of a referenced plan would violate.
    before(async () => {
      await sails.sendNativeQuery(`
        ALTER TABLE t_point DROP CONSTRAINT IF EXISTS t_point_reference_document_fk;
        ALTER TABLE t_point
          ADD CONSTRAINT t_point_reference_document_fk
          FOREIGN KEY (id_reference_document) REFERENCES t_document(id) NOT VALID;
      `);
    });

    after(async () => {
      await sails.sendNativeQuery(
        'ALTER TABLE t_point DROP CONSTRAINT IF EXISTS t_point_reference_document_fk'
      );
    });

    // The plan is already soft-deleted, as in the other permanent delete
    // tests: the test database has no histo_delete trigger turning the first
    // DELETE into a soft delete.
    const createPositionedPoints = async () => {
      const plan = await TDocument.create({
        author: 1,
        type: 13,
        license: 1,
        isValidated: true,
        isDeleted: true,
      }).fetch();
      const points = await Promise.all([
        TPoint.create({
          label: 'On the plan',
          author: 1,
          referenceDocument: plan.id,
          x: 1,
          y: 2,
        }).fetch(),
        TPoint.create({
          label: 'Deleted, on the plan',
          author: 1,
          referenceDocument: plan.id,
          x: 3,
          y: 4,
          isDeleted: true,
        }).fetch(),
      ]);
      return { plan, pointIds: points.map((p) => p.id) };
    };

    const expectPositionsCleared = async (pointIds) => {
      const points = await TPoint.find({ id: pointIds });
      should(points).have.length(2);
      points.forEach((point) => {
        should(point).match({ referenceDocument: null, x: null, y: null });
      });
      await TPoint.destroy({ id: pointIds });
    };

    it('clears the positions of the points drawn on it', async () => {
      const { plan, pointIds } = await createPositionedPoints();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/documents/${plan.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(await TDocument.findOne(plan.id)).be.undefined();
      await expectPositionsCleared(pointIds);
    });

    it('clears the positions when merging the plan into another document', async () => {
      const { plan, pointIds } = await createPositionedPoints();
      const target = await TDocument.create({
        author: 1,
        type: 13,
        license: 1,
        isValidated: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/documents/${plan.id}?isPermanent=true&entityId=${target.id}`
        )
        .set('Authorization', adminToken)
        .set('Accept', 'application/json')
        .expect(200);

      should(await TDocument.findOne(plan.id)).be.undefined();
      await expectPositionsCleared(pointIds);
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
