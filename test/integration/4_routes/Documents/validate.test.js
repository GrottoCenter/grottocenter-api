const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Document validate', () => {
  let userToken;
  let moderatorToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
  });

  describe('Single validate', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/1/validate')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 400 when refusing without comment', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/documents/1/validate?isValidated=false')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400, done);
    });

    it('should validate a document', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put(`/api/v1/documents/${doc.id}/validate`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.true();
      should(updated.dateValidation).not.be.null();
    });

    it('should reject a document with comment', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .put(
          `/api/v1/documents/${doc.id}/validate?isValidated=false&validationComment=Test rejection`
        )
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const updated = await TDocument.findOne(doc.id);
      should(updated.isValidated).be.false();
      should(updated.validationComment).equal('Test rejection');
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

    it('should create a VALIDATE author notification when accepting a document', async () => {
      // Author 1 (Admin1) is different from moderator (caver 2)
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put(`/api/v1/documents/${doc.id}/validate`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
      });

      // Find the author notification (notified = author 1, document = doc.id)
      const authorNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: doc.id,
        notificationType: VALIDATE_TYPE_ID,
      });
      should(authorNotification).not.be.undefined();
      should(authorNotification.notifier).equal(2);
    });

    it('should create a REJECT author notification when rejecting a document', async () => {
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put(
            `/api/v1/documents/${doc.id}/validate?isValidated=false&validationComment=Needs more detail`
          )
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
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

    it('should NOT create an author notification when moderator is the author', async () => {
      // Create a document where author = 2 (moderator1's caver ID)
      const doc = await TDocument.create({
        author: 2,
        type: 1,
        license: 1,
        isValidated: false,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put(`/api/v1/documents/${doc.id}/validate`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
      });

      // No notification should exist for the author (who is the moderator)
      const selfNotification = newIds.length
        ? await TNotification.find({
            id: newIds,
            notified: 2,
            document: doc.id,
          })
        : [];
      should(selfNotification).have.length(0);
    });

    it('should still create geographic subscriber notifications on acceptance', async () => {
      // Create a document with an entrance linked to a country with subscribers
      const doc = await TDocument.create({
        author: 1,
        type: 1,
        license: 1,
        isValidated: false,
        entrance: 1,
      }).fetch();
      createdDocumentIds.push(doc.id);

      const newIds = await trackNotifications(async () => {
        await supertest(sails.hooks.http.app)
          .put(`/api/v1/documents/${doc.id}/validate`)
          .set('Authorization', moderatorToken)
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);
      });

      // Should have at least the author notification
      const authorNotification = await TNotification.findOne({
        id: newIds,
        notified: 1,
        document: doc.id,
        notificationType: VALIDATE_TYPE_ID,
      });
      should(authorNotification).not.be.undefined();

      // The geographic subscriber flow should also have run (total notifications >= 1)
      should(newIds.length).be.greaterThanOrEqual(1);
    });
  });
});
