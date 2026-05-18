const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document delete', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
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
        .set('Authorization', moderatorToken)
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
        .set('Authorization', moderatorToken)
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
        .set('Authorization', moderatorToken)
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
        .set('Authorization', moderatorToken)
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
        .set('Authorization', moderatorToken)
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
        .set('Authorization', moderatorToken)
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
});
