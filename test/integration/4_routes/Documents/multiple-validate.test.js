const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document multiple-validate', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Multiple validate', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({ documents: [] })
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 400 when refusing without comment', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: 1, isValidated: 'false' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should validate empty list of documents', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({ documents: [] })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204, done);
    });

    it('should validate a single document', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: doc.id, isValidated: 'true' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
    });

    it('should validate multiple documents', async () => {
      const doc1 = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      const doc2 = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [
            { id: doc1.id, isValidated: 'true' },
            { id: doc2.id, isValidated: 'true' },
          ],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated1 = await TDocument.findOne(doc1.id);
      const updated2 = await TDocument.findOne(doc2.id);
      should(updated1.isValidated).be.true();
      should(updated2.isValidated).be.true();
    });

    it('should reject a document with comment', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [
            {
              id: doc.id,
              isValidated: 'false',
              validationComment: 'Rejected for testing',
            },
          ],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
      should(updated.validationComment).equal('Rejected for testing');
    });

    it('should validate document with modifiedDocJson', async () => {
      const desc = await TDescription.create({
        author: 1,
        title: 'Original',
        body: 'Original body',
      }).fetch();

      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        descriptions: [desc.id],
        modifiedDocJson: {
          reviewerId: 2,
          documentData: { type: 17 },
          descriptionData: { title: 'Updated', body: 'Updated body' },
        },
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: doc.id, isValidated: 'true' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
      should(updated.modifiedDocJson).be.null();
    });

    it('should validate document with modifiedDocJson containing massifs as objects', async () => {
      const massif = await TMassif.create({ author: 1 }).fetch();

      const desc = await TDescription.create({
        author: 1,
        title: 'Original',
        body: 'Original body',
      }).fetch();

      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        descriptions: [desc.id],
        modifiedDocJson: {
          reviewerId: 2,
          documentData: {
            type: 17,
            massifs: [{ id: massif.id, name: 'Some massif' }],
          },
          descriptionData: { title: 'Updated', body: 'Updated body' },
        },
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put('/api/v1/documents/validate')
        .send({
          documents: [{ id: doc.id, isValidated: 'true' }],
        })
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204);

      const updated = await TDocument.findOne(doc.id).populate('massifs');
      should(updated.isValidated).be.true();
      should(updated.modifiedDocJson).be.null();
      should(updated.massifs).be.an.Array();
      should(updated.massifs.map((m) => m.id)).containDeep([massif.id]);

      const updatedDesc = await TDescription.findOne(desc.id);
      should(updatedDesc.title).equal('Updated');
      should(updatedDesc.body).equal('Updated body');
    });

    describe('Collection replace behaviour', () => {
      // Track all records created by the tests in this block so they can be
      // cleaned up after the suite — prevents cross-shard fixture pollution.
      const createdDocIds = [];
      const createdDescIds = [];

      after(async () => {
        if (createdDocIds.length > 0)
          await TDocument.destroy({ id: createdDocIds });
        if (createdDescIds.length > 0)
          await TDescription.destroy({ id: createdDescIds });
      });

      it('should replace authors collection when validating a document with modifiedDocJson', async () => {
        const desc = await TDescription.create({
          author: 1,
          title: 'Original',
          body: 'Original body',
        }).fetch();
        createdDescIds.push(desc.id);

        // Document starts with caver 1 as an author
        const doc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          authors: [1],
          descriptions: [desc.id],
          modifiedDocJson: {
            reviewerId: 2,
            // Editor requests: remove caver 1, add caver 6 as the sole author
            documentData: {
              type: 1,
              authors: [6],
            },
            descriptionData: { title: 'Original', body: 'Original body' },
          },
        }).fetch();
        createdDocIds.push(doc.id);

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(doc.id).populate('authors');
        // Only caver 6 should be listed; caver 1 must have been removed
        const authorIds = updated.authors.map((a) => a.id);
        should(authorIds).containEql(6);
        should(authorIds).not.containEql(1);
      });

      it('should clear authors and replace with authorsOrganization when validating', async () => {
        const desc = await TDescription.create({
          author: 1,
          title: 'Org only',
          body: 'Body',
        }).fetch();
        createdDescIds.push(desc.id);

        // Document starts with caver 1 as a person author and no grotto authors
        const doc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          authors: [1],
          descriptions: [desc.id],
          modifiedDocJson: {
            reviewerId: 2,
            // Editor wants to remove all person authors and replace with grotto 1
            documentData: {
              type: 1,
              authors: [],
              authorsOrganization: [1],
            },
            descriptionData: { title: 'Org only', body: 'Body' },
          },
        }).fetch();
        createdDocIds.push(doc.id);

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(doc.id)
          .populate('authors')
          .populate('authorsOrganization');
        // All person authors must have been cleared
        should(updated.authors).have.length(0);
        // Grotto 1 must be present
        const grottoIds = updated.authorsOrganization.map((g) => g.id);
        should(grottoIds).containEql(1);
      });

      it('should leave untouched collections unchanged when field is absent from modifiedDocJson', async () => {
        const desc = await TDescription.create({
          author: 1,
          title: 'Untouched',
          body: 'Body',
        }).fetch();
        createdDescIds.push(desc.id);

        const doc = await TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          isValidated: false,
          authors: [1],
          descriptions: [desc.id],
          modifiedDocJson: {
            reviewerId: 2,
            // Only type is changed; authors is intentionally absent
            documentData: { type: 17 },
            descriptionData: { title: 'Untouched', body: 'Body' },
          },
        }).fetch();
        createdDocIds.push(doc.id);

        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);

        const updated = await TDocument.findOne(doc.id).populate('authors');
        // authors was not touched — caver 1 must still be there
        const authorIds = updated.authors.map((a) => a.id);
        should(authorIds).containEql(1);
      });
    });
  });

  describe('Author notifications', () => {
    // Moderator1 (caver ID 2) validates/rejects documents
    // VALIDATE type ID = 4, REJECT type ID = 7
    const VALIDATE_TYPE_ID = 4;
    const REJECT_TYPE_ID = 7;
    const createdNotificationIds = [];
    const createdDocumentIds = [];

    after(async () => {
      if (createdNotificationIds.length > 0) {
        await TNotification.destroy({ id: createdNotificationIds });
      }
      if (createdDocumentIds.length > 0) {
        await TDocument.destroy({ id: createdDocumentIds });
      }
    });

    const trackNotifications = async (callback) => {
      const beforeIds = (await TNotification.find().select(['id'])).map(
        (n) => n.id
      );
      await callback();
      const afterIds = (await TNotification.find().select(['id'])).map(
        (n) => n.id
      );
      const newIds = afterIds.filter((id) => !beforeIds.includes(id));
      createdNotificationIds.push(...newIds);
      return newIds;
    };

    it('should create a VALIDATE author notification when accepting a document via batch', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
      });

      const authorNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: doc.id,
        notificationType: VALIDATE_TYPE_ID,
      });
      should(authorNotification).not.be.undefined();
      should(authorNotification.notifier).equal(2);
    });

    it('should create a REJECT author notification when rejecting a document via batch', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [
              {
                id: doc.id,
                isValidated: 'false',
                validationComment: 'Needs revision',
              },
            ],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
      });

      const authorNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: doc.id,
        notificationType: REJECT_TYPE_ID,
      });
      should(authorNotification).not.be.undefined();
      should(authorNotification.notifier).equal(2);
    });

    it('should NOT create author notifications when moderator is the author', async () => {
      const doc = await TDocument.create({
        author: 2,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [{ id: doc.id, isValidated: 'true' }],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
      });

      const selfNotification = newIds.length
        ? await TNotification.find({
            id: newIds,
            notified: 2,
            document: doc.id,
          })
        : [];
      should(selfNotification).have.length(0);
    });

    it('should create correct notification types for a mixed batch', async () => {
      const acceptedDoc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(acceptedDoc.id);

      const rejectedDoc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(rejectedDoc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .send({
            documents: [
              { id: acceptedDoc.id, isValidated: 'true' },
              {
                id: rejectedDoc.id,
                isValidated: 'false',
                validationComment: 'Incomplete data',
              },
            ],
          })
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(204);
      });

      const validateNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: acceptedDoc.id,
        notificationType: VALIDATE_TYPE_ID,
      });
      should(validateNotification).not.be.undefined();
      should(validateNotification.notifier).equal(2);

      const rejectNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: rejectedDoc.id,
        notificationType: REJECT_TYPE_ID,
      });
      should(rejectNotification).not.be.undefined();
      should(rejectNotification.notifier).equal(2);
    });
  });
});
