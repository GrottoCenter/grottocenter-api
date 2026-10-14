/**
 * Regression test for issue #1781:
 * "Recent changes list document updates that did not happen"
 *
 * Root cause (fixed):
 *   change_document() logged an 'update' for every UPDATE of a validated
 *   document, credited to COALESCE(id_reviewer, id_author). Deleting a cave,
 *   or linking a document to a cave or an entrance, rewrites t_document rows
 *   without touching id_reviewer, so each of them showed up as an edit by
 *   whoever last reviewed the document.
 *
 *   Fix: only log a document change when it becomes visible, i.e. when the
 *   row goes from not validated to validated.
 */
const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const CommonService = require('../../../../api/services/CommonService');
const DocumentService = require('../../../../api/services/DocumentService');

const ADMIN_ID = 1;
const MODERATOR_ID = 2;

// Raw SQL: Waterline warns on every null column of t_last_change
const documentChanges = async (documentId) =>
  (
    await CommonService.query(
      `SELECT type_change, id_author, name FROM t_last_change
       WHERE type_entity = 'document' AND id_entity = $1 ORDER BY id`,
      [documentId]
    )
  ).rows;

// A validated document last reviewed by someone other than the actor
const createValidatedDocument = (data = {}) =>
  TDocument.create({
    author: ADMIN_ID,
    reviewer: MODERATOR_ID,
    type: 1,
    license: 1,
    isValidated: true,
    dateValidation: new Date(),
    ...data,
  }).fetch();

describe('Changes - GET /api/v1/changes/recent', () => {
  describe('Issue #1781 — side effects on documents are not document changes', () => {
    let userToken;
    let moderatorToken;
    let userId;

    // PUT /documents/validate for one document, checking its outcome (#1817)
    const validateDocument = async (entry, status) => {
      const res = await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({ documents: [entry] })
        .set('Authorization', moderatorToken)
        .expect(200);
      should(res.body).match([{ id: entry.id, status }]);
    };

    before(async () => {
      userToken = await AuthTokenService.getRawBearerUserToken();
      moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
      userId = (await TCaver.findOne({ mail: 'user1@user1.com' })).id;
    });

    it('should not log the documents moved by a cave merge', async () => {
      const caveId = (await TCave.create({}).fetch()).id;
      const targetCaveId = (await TCave.create({}).fetch()).id;
      const document = await createValidatedDocument({ cave: caveId });
      const before = await documentChanges(document.id);

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/caves/${caveId}?isPermanent=true&entityId=${targetCaveId}`
        )
        .set('Authorization', moderatorToken)
        .expect(200);

      should((await TDocument.findOne(document.id)).cave).equal(targetCaveId);
      should(await documentChanges(document.id)).have.length(before.length);
    });

    it('should not log a document linked to a cave', async () => {
      const caveId = (await TCave.create({}).fetch()).id;
      const document = await createValidatedDocument();
      const before = await documentChanges(document.id);

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/caves/${caveId}/documents/${document.id}`)
        .set('Authorization', userToken)
        .expect(204);

      should((await TDocument.findOne(document.id)).cave).equal(caveId);
      should(await documentChanges(document.id)).have.length(before.length);
    });

    it('should not log a document linked to an entrance', async () => {
      const document = await createValidatedDocument();
      const before = await documentChanges(document.id);

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/entrances/1/documents/${document.id}`)
        .set('Authorization', userToken)
        .expect(204);

      const entrance = await TEntrance.findOne(1).populate('documents');
      should(entrance.documents.map((d) => d.id)).containEql(document.id);
      should(await documentChanges(document.id)).have.length(before.length);
    });

    it('should log a validated contribution as an update by its contributor', async () => {
      const document = await createValidatedDocument();
      await TDescription.create({
        author: ADMIN_ID,
        document: document.id,
        language: 'fra',
        title: 'Before #1781',
      });
      await DocumentService.updateDocument({
        documentId: document.id,
        reviewerId: userId,
        documentData: {},
        descriptionData: { title: 'After #1781' },
      });
      const before = await documentChanges(document.id);

      await validateDocument(
        { id: document.id, isValidated: 'true' },
        'validated'
      );

      const added = (await documentChanges(document.id)).slice(before.length);
      should(added).have.length(1);
      should(added[0]).eql({
        type_change: 'update',
        id_author: userId,
        name: 'After #1781',
      });
    });

    it('should log the validation of a new document as its creation by its author', async () => {
      const document = await TDocument.create({
        author: userId,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      should(await documentChanges(document.id)).have.length(0);

      await validateDocument(
        { id: document.id, isValidated: 'true' },
        'validated'
      );

      const changes = await documentChanges(document.id);
      should(changes).have.length(1);
      should(changes[0]).match({ type_change: 'create', id_author: userId });
    });

    it('should not log the rejection of a contribution', async () => {
      const document = await createValidatedDocument();
      await DocumentService.updateDocument({
        documentId: document.id,
        reviewerId: userId,
        documentData: {},
        descriptionData: { title: 'Rejected #1781' },
      });
      const before = await documentChanges(document.id);

      await validateDocument(
        {
          id: document.id,
          isValidated: 'false',
          validationComment: 'Rejected',
        },
        'rejected'
      );

      const rejected = await TDocument.findOne(document.id);
      should(rejected.isValidated).be.true();
      should(rejected.modifiedDocJson).be.null();
      should(await documentChanges(document.id)).have.length(before.length);
    });

    it('should not log the rejection of a new document', async () => {
      const document = await TDocument.create({
        author: userId,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await validateDocument(
        {
          id: document.id,
          isValidated: 'false',
          validationComment: 'Rejected',
        },
        'rejected'
      );

      should((await TDocument.findOne(document.id)).isValidated).be.true();
      should(await documentChanges(document.id)).have.length(0);
    });

    it('should not log an auto-rejected contribution', async () => {
      // A pending parent that is a child of the document is a cycle, which
      // multiple-validate.js refuses when the moderator accepts it
      const document = await TDocument.create({
        author: userId,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      const child = await createValidatedDocument({
        type: 17,
        parent: document.id,
      });
      await TDocument.updateOne(document.id).set({
        modifiedDocJson: {
          reviewerId: userId,
          documentData: { type: 17, parent: child.id },
          descriptionData: {},
        },
      });

      await validateDocument(
        { id: document.id, isValidated: 'true' },
        'auto_rejected'
      );

      const rejected = await TDocument.findOne(document.id);
      should(rejected.validationComment).match(/^Auto-rejected/);
      should(rejected.isValidated).be.true();
      should(await documentChanges(document.id)).have.length(0);
    });

    it('should log a direct edit of a validated document as an update by its editor', async () => {
      const document = await createValidatedDocument({ pages: '10' });
      await TDescription.create({
        author: ADMIN_ID,
        document: document.id,
        language: 'fra',
        title: 'Edited #1781',
      });
      const before = await documentChanges(document.id);

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${document.id}/new-entities`)
        .send({ document: { pages: '20' } })
        .set('Authorization', userToken)
        .expect(200);

      should((await TDocument.findOne(document.id)).pages).equal('20');
      const added = (await documentChanges(document.id)).slice(before.length);
      should(added).eql([
        { type_change: 'update', id_author: userId, name: 'Edited #1781' },
      ]);
    });

    it('should not log a direct edit of a document that is not validated', async () => {
      const document = await TDocument.create({
        author: userId,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${document.id}/new-entities`)
        .send({ document: { pages: '20' } })
        .set('Authorization', userToken)
        .expect(200);

      should((await TDocument.findOne(document.id)).pages).equal('20');
      should(await documentChanges(document.id)).have.length(0);
    });

    it('should log a direct edit that validates a document only as its creation', async () => {
      const document = await TDocument.create({
        author: ADMIN_ID,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${document.id}/new-entities`)
        .send({ document: { isValidated: true, pages: '20' } })
        .set('Authorization', userToken)
        .expect(200);

      const updated = await TDocument.findOne(document.id);
      should(updated).match({ isValidated: true, pages: '20' });
      const changes = await documentChanges(document.id);
      should(changes).have.length(1);
      should(changes[0]).match({ type_change: 'create', id_author: ADMIN_ID });
    });

    it('should not show the side effects in the recent changes', async () => {
      const caveId = (await TCave.create({}).fetch()).id;
      const targetCaveId = (await TCave.create({}).fetch()).id;
      const document = await createValidatedDocument({ cave: caveId });

      await supertest(sails.hooks.http.app)
        .delete(
          `/api/v1/caves/${caveId}?isPermanent=true&entityId=${targetCaveId}`
        )
        .set('Authorization', moderatorToken)
        .expect(200);

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/changes/recent?limit=500')
        .expect(200);
      const documentGroups = res.body.changes.filter(
        (c) => c.mainEntityType === 'document' && c.mainEntityId === document.id
      );
      // Only the creation of the (already validated) fixture document remains
      should(documentGroups.map((c) => c.mainAction)).eql(['create']);
    });
  });
});
