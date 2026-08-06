const should = require('should');
const sinon = require('sinon');
const CaveService = require('../../../api/services/CaveService');
const MessageService = require('../../../api/services/MessageService');
const NotificationService = require('../../../api/services/NotificationService');
const {
  NOTIFICATION_ENTITIES,
  NOTIFICATION_TYPES,
} = require('../../../api/services/NotificationService');
const tnotificationtypeFixture = require('../../fixtures/tnotificationtype.json');

describe('NotificationService', () => {
  describe('IMPORT_COMPLETE notification type', () => {
    it('should have IMPORT_COMPLETE in NOTIFICATION_TYPES', () => {
      should(NOTIFICATION_TYPES).have.property('IMPORT_COMPLETE');
      should(NOTIFICATION_TYPES.IMPORT_COMPLETE).equal('IMPORT_COMPLETE');
    });

    it('should not throw when sendNotificationEmail is called with IMPORT_COMPLETE type', async () => {
      const user = await TCaver.findOne(1);
      await NotificationService.sendNotificationEmail(
        { id: 1, name: 'test document' },
        NOTIFICATION_TYPES.IMPORT_COMPLETE,
        NOTIFICATION_ENTITIES.DOCUMENT,
        user
      );
    });
  });

  describe('REJECT notification type', () => {
    it('should have REJECT in NOTIFICATION_TYPES with value "REJECT"', () => {
      should(NOTIFICATION_TYPES).have.property('REJECT');
      should(NOTIFICATION_TYPES.REJECT).equal('REJECT');
    });

    it('should have a REJECT entry with id 7 in the tnotificationtype fixture', () => {
      const rejectEntry = tnotificationtypeFixture.find(
        (entry) => entry.name === 'REJECT'
      );
      should(rejectEntry).not.be.undefined();
      should(rejectEntry.id).equal(7);
      should(rejectEntry.name).equal('REJECT');
    });

    it('should not throw when sendNotificationEmail is called with REJECT type', async () => {
      const user = await TCaver.findOne(1);
      await NotificationService.sendNotificationEmail(
        { id: 1, name: 'test document' },
        NOTIFICATION_TYPES.REJECT,
        NOTIFICATION_ENTITIES.DOCUMENT,
        user
      );
    });
  });

  describe('sendNotificationEmail()', () => {
    let user;
    before(async () => {
      user = await TCaver.findOne(1);
    });

    const doSendEmail = (entity, notifType, notifEntity) =>
      NotificationService.sendNotificationEmail(
        entity,
        notifType,
        notifEntity,
        user
      );

    it('should throw an error on invalid notification type', (done) => {
      doSendEmail(
        { name: 'test' },
        'invalidNotifType',
        NOTIFICATION_ENTITIES.CAVE
      )
        .then(() => done(new Error('should not succeed')))
        .catch(() => done());
    });

    it('should throw an error on invalid notification entity', (done) => {
      doSendEmail(
        { name: 'test' },
        NOTIFICATION_TYPES.DELETE,
        'invalidNotifEntity'
      )
        .then(() => done(new Error('should not succeed')))
        .catch(() => done());
    });

    it('should successfully try to send an email for document, description, comment & massif related operations', (done) => {
      Object.values(NOTIFICATION_TYPES).forEach(async (type) => {
        await doSendEmail(
          { id: 1, name: 'test' },
          type,
          NOTIFICATION_ENTITIES.DOCUMENT
        ).catch((e) => done(e));
      });
      done();
    });

    it('should successfully try to send an email for description-related operations', (done) => {
      Object.values(NOTIFICATION_TYPES).forEach(async (type) => {
        await doSendEmail(
          { id: 5, title: 'Best description for entrance 1', entrance: 1 },
          type,
          NOTIFICATION_ENTITIES.DESCRIPTION
        ).catch((e) => done(e));
      });
      done();
    });

    it('should successfully try to send an email for comment-related operations', (done) => {
      Object.values(NOTIFICATION_TYPES).forEach(async (type) => {
        await doSendEmail(
          { id: 1, title: 'Title comment 1', entrance: 1 },
          type,
          NOTIFICATION_ENTITIES.COMMENT
        ).catch((e) => done(e));
      });
      done();
    });

    it('should successfully try to send an email for massif-related operations', (done) => {
      Object.values(NOTIFICATION_TYPES).forEach(async (type) => {
        await doSendEmail({ id: 5 }, type, NOTIFICATION_ENTITIES.MASSIF).catch(
          (e) => done(e)
        );
      });
      done();
    });

    // Additional coverage tests
    it('should handle entity with names array', async () => {
      await doSendEmail(
        { id: 1, names: [{ name: 'Test Cave' }] },
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.CAVE
      );
    });

    it('should handle entity with titles array', async () => {
      await doSendEmail(
        { id: 1, titles: [{ text: 'Test Title' }] },
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.DOCUMENT
      );
    });

    it('should handle entity with body', async () => {
      await doSendEmail(
        {
          id: 1,
          body: 'This is a long body text that should be truncated after 50 characters to test the truncation logic',
          cave: 1,
        },
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.COMMENT
      );
    });

    it('should handle entity with descriptions array', async () => {
      await doSendEmail(
        { id: 1, descriptions: [{ title: 'Description Title' }] },
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.ENTRANCE
      );
    });

    it('should handle LOCATION entity with entrance relation', async () => {
      await doSendEmail(
        { id: 1, entrance: 1 },
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.LOCATION
      );
    });

    it('should throw error for LOCATION without entrance', async () => {
      try {
        await doSendEmail(
          { id: 1 },
          NOTIFICATION_TYPES.CREATE,
          NOTIFICATION_ENTITIES.LOCATION
        );
        throw new Error('Should have thrown');
      } catch (error) {
        should(error.message).containEql("Can't find related entity");
      }
    });

    it('should handle DESCRIPTION with massif relation', async () => {
      await doSendEmail(
        { id: 1, massif: 1 },
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.DESCRIPTION
      );
    });

    it('should throw error for DESCRIPTION without relations', async () => {
      try {
        await doSendEmail(
          { id: 1 },
          NOTIFICATION_TYPES.CREATE,
          NOTIFICATION_ENTITIES.DESCRIPTION
        );
        throw new Error('Should have thrown');
      } catch (error) {
        should(error.message).containEql("Can't find related entity");
      }
    });

    it('should handle COMMENT/HISTORY/RIGGING with cave relation', async () => {
      await doSendEmail(
        { id: 1, cave: 1 },
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.COMMENT
      );
    });

    it('should throw error for COMMENT without cave or entrance', async () => {
      try {
        await doSendEmail(
          { id: 1 },
          NOTIFICATION_TYPES.CREATE,
          NOTIFICATION_ENTITIES.COMMENT
        );
        throw new Error('Should have thrown');
      } catch (error) {
        should(error.message).containEql("Can't find related entity");
      }
    });

    it('should complete without error for author rejection email', async () => {
      await NotificationService.sendNotificationEmail(
        { id: 1, name: 'Test Document' },
        NOTIFICATION_TYPES.REJECT,
        NOTIFICATION_ENTITIES.DOCUMENT,
        {
          ...user,
          isAuthorNotification: true,
          validationComment: 'Incomplete metadata',
        }
      );
    });

    it('should complete without error for author acceptance email', async () => {
      await NotificationService.sendNotificationEmail(
        { id: 1, name: 'Test Document' },
        NOTIFICATION_TYPES.VALIDATE,
        NOTIFICATION_ENTITIES.DOCUMENT,
        { ...user, isAuthorNotification: true, validationComment: null }
      );
    });

    it('should complete without error for default subscriber email', async () => {
      await NotificationService.sendNotificationEmail(
        { id: 1, name: 'Test Document' },
        NOTIFICATION_TYPES.VALIDATE,
        NOTIFICATION_ENTITIES.DOCUMENT,
        { ...user, isAuthorNotification: false }
      );
    });
  });

  describe('notifySubscribers()', () => {
    let entrance2;
    let history1;
    let user3;
    const createdNotificationIds = [];

    before(async () => {
      history1 = await THistory.findOne(1).populate('cave');
      await CaveService.setEntrances([history1.cave]);
      entrance2 = await TEntrance.findOne(2);
      user3 = await TCaver.findOne(3);
    });
    after(async () => {
      if (createdNotificationIds.length > 0) {
        await TNotification.destroy({ id: createdNotificationIds });
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
    };

    it('should create a notification about the entrance for user 1 subscribed to the country FR', async () => {
      await trackNotifications(async () => {
        const res = await NotificationService.notifySubscribers(
          { ...entrance2, country: 'FR' },
          user3.id,
          NOTIFICATION_TYPES.UPDATE,
          NOTIFICATION_ENTITIES.ENTRANCE
        );
        if (!res) throw Error('should succeed');
        const user1Notifications = await TNotification.find({
          notified: 1,
          notifier: 3,
          entrance: entrance2.id,
        });
        should(user1Notifications).have.length(1);
      });
    });

    it('should create a notification about the cave history for user 1 subscribed to the massif with id 1', async () => {
      await trackNotifications(async () => {
        const res = await NotificationService.notifySubscribers(
          history1,
          user3.id,
          NOTIFICATION_TYPES.CREATE,
          NOTIFICATION_ENTITIES.HISTORY
        );
        if (!res) throw Error('should succeed');
        const user1Notifications = await TNotification.find({
          notified: 1,
          notifier: 3,
          history: history1.id,
        });
        should(user1Notifications).have.length(1);
        should(user1Notifications[0].history).be.equal(1);
      });
    });

    it('should create a notification about the entrance for user 1 subscribed to the region FR-01', async () => {
      await trackNotifications(async () => {
        const entrance = await TEntrance.findOne(2); // Has iso_3166_2: "FR-01"
        const res = await NotificationService.notifySubscribers(
          entrance,
          user3.id,
          NOTIFICATION_TYPES.CREATE, // Use CREATE to avoid conflicts with UPDATE tests
          NOTIFICATION_ENTITIES.ENTRANCE
        );
        if (!res) throw Error('should succeed');
        const user1Notifications = await TNotification.find({
          notified: 1,
          notifier: 3,
          entrance: entrance.id,
          notificationType: (
            await TNotificationType.findOne({ name: NOTIFICATION_TYPES.CREATE })
          ).id,
        });
        // User 1 gets 1 consolidated notification combining country (FR) and region (FR-01) subscriptions
        should(user1Notifications).have.length(1);
      });
    });

    // Additional coverage tests
    it('should throw error for invalid notification entity in notifySubscribers', async () => {
      try {
        await NotificationService.notifySubscribers(
          { id: 1 },
          3,
          NOTIFICATION_TYPES.CREATE,
          'invalid_entity'
        );
        throw new Error('Should have thrown');
      } catch (error) {
        should(error.message).containEql('Invalid notification entity');
      }
    });

    it('should throw error for invalid notification type in notifySubscribers', async () => {
      try {
        await NotificationService.notifySubscribers(
          { id: 1 },
          3,
          'INVALID_TYPE',
          NOTIFICATION_ENTITIES.CAVE
        );
        throw new Error('Should have thrown');
      } catch (error) {
        should(error.message).containEql('Invalid notification type');
      }
    });

    it('should throw error for missing notifier id', async () => {
      try {
        await NotificationService.notifySubscribers(
          { id: 1 },
          null,
          NOTIFICATION_TYPES.CREATE,
          NOTIFICATION_ENTITIES.CAVE
        );
        throw new Error('Should have thrown');
      } catch (error) {
        should(error.message).containEql('Missing notifier id');
      }
    });

    it('should handle CAVE entity notifications', async () => {
      const cave = await TCave.findOne(1);
      const res = await NotificationService.notifySubscribers(
        cave,
        user3.id,
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.CAVE
      );
      should(res).not.be.false();
    });

    it('should handle CAVE entity notifications with region from entrance', async () => {
      const cave = await TCave.findOne(1);
      await CaveService.setEntrances([cave]);
      // Cave 1 has entrance 2 which has iso_3166_2: "FR-01"
      const res = await NotificationService.notifySubscribers(
        cave,
        user3.id,
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.CAVE
      );
      should(res).not.be.false();
    });

    it('should handle MASSIF entity notifications', async () => {
      const massif = await TMassif.findOne(1);
      const res = await NotificationService.notifySubscribers(
        massif,
        user3.id,
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.MASSIF
      );
      should(res).not.be.false();
    });

    it('should handle ORGANIZATION entity notifications', async () => {
      const grotto = await TGrotto.findOne(1);
      const res = await NotificationService.notifySubscribers(
        grotto,
        user3.id,
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.ORGANIZATION
      );
      should(res).not.be.false();
    });

    it('should handle ORGANIZATION entity notifications with region', async () => {
      const grotto = { ...(await TGrotto.findOne(1)), iso_3166_2: 'FR-01' };
      const res = await NotificationService.notifySubscribers(
        grotto,
        user3.id,
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.ORGANIZATION
      );
      should(res).not.be.false();
    });

    it('should handle DOCUMENT entity notifications', async () => {
      const document = await TDocument.findOne(1);
      const res = await NotificationService.notifySubscribers(
        document,
        user3.id,
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.DOCUMENT
      );
      should(res).not.be.false();
    });

    it('should handle DESCRIPTION entity notifications with cave relation', async () => {
      const description = await TDescription.findOne(6); // Use new fixture with cave relation
      const res = await NotificationService.notifySubscribers(
        description,
        user3.id,
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.DESCRIPTION
      );
      should(res).not.be.false();
    });

    it('should handle RIGGING entity notifications with cave relation', async () => {
      const rigging = await TRigging.findOne(4); // Use new fixture with cave relation
      const res = await NotificationService.notifySubscribers(
        rigging,
        user3.id,
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.RIGGING
      );
      should(res).not.be.false();
    });

    it('should handle LOCATION entity notifications', async () => {
      const location = await TLocation.findOne(1);
      const res = await NotificationService.notifySubscribers(
        location,
        user3.id,
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.LOCATION
      );
      should(res).not.be.false();
    });

    it('should handle LOCATION entity notifications with region from entrance', async () => {
      // Create a location with entrance that has region
      const location = { id: 1, entrance: 2 }; // Entrance 2 has iso_3166_2: "FR-01"
      const res = await NotificationService.notifySubscribers(
        location,
        user3.id,
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.LOCATION
      );
      should(res).not.be.false();
    });

    it('should handle COMMENT entity notifications', async () => {
      const comment = await TComment.findOne(1);
      const res = await NotificationService.notifySubscribers(
        comment,
        user3.id,
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.COMMENT
      );
      should(res).not.be.false();
    });
  });

  describe('notifyAuthor()', () => {
    // Document 1 has author: 1 (Admin1)
    // Caver 3 (User1) is NOT the author — use as moderator
    const moderatorId = 3;
    const authorId = 1;
    const createdNotificationIds = [];
    let sendEmailStub;

    after(async () => {
      if (createdNotificationIds.length > 0) {
        await TNotification.destroy({ id: createdNotificationIds });
      }
      // Restore sendNotificationByEmail to default for author caver
      await TCaver.updateOne({ id: authorId }).set({
        sendNotificationByEmail: false,
      });
    });

    afterEach(() => {
      if (sendEmailStub) {
        sendEmailStub.restore();
        sendEmailStub = null;
      }
    });

    const trackNotifications = async (callback) => {
      const beforeIds = (await TNotification.find().select(['id'])).map(
        (n) => n.id
      );
      const result = await callback();
      const afterIds = (await TNotification.find().select(['id'])).map(
        (n) => n.id
      );
      const newIds = afterIds.filter((id) => !beforeIds.includes(id));
      createdNotificationIds.push(...newIds);
      return { newIds, result };
    };

    it('should create a VALIDATE notification for the document author on acceptance', async () => {
      const document = { id: 1, author: authorId, name: 'Test Document' };
      const validateTypeId = (
        await TNotificationType.findOne({ name: NOTIFICATION_TYPES.VALIDATE })
      ).id;

      const { newIds } = await trackNotifications(() =>
        NotificationService.notifyAuthor(
          document,
          moderatorId,
          NOTIFICATION_TYPES.VALIDATE,
          null
        )
      );

      should(newIds).have.length(1);
      const notification = await TNotification.findOne({ id: newIds[0] });
      should(notification.notified).equal(authorId);
      should(notification.document).equal(document.id);
      should(notification.notificationType).equal(validateTypeId);
    });

    it('should create a REJECT notification for the document author on rejection', async () => {
      const document = { id: 1, author: authorId, name: 'Test Document' };
      const rejectTypeId = (
        await TNotificationType.findOne({ name: NOTIFICATION_TYPES.REJECT })
      ).id;

      const { newIds } = await trackNotifications(() =>
        NotificationService.notifyAuthor(
          document,
          moderatorId,
          NOTIFICATION_TYPES.REJECT,
          'Incomplete metadata'
        )
      );

      should(newIds).have.length(1);
      const notification = await TNotification.findOne({ id: newIds[0] });
      should(notification.notified).equal(authorId);
      should(notification.document).equal(document.id);
      should(notification.notificationType).equal(rejectTypeId);
    });

    it('should skip notification when moderator is the document author', async () => {
      // Use authorId as both moderator and author (self-notification)
      const document = { id: 1, author: authorId, name: 'Test Document' };

      const { newIds, result } = await trackNotifications(() =>
        NotificationService.notifyAuthor(
          document,
          authorId,
          NOTIFICATION_TYPES.VALIDATE,
          null
        )
      );

      should(result).equal(true);
      should(newIds).have.length(0);
    });

    it('should set the notifier field to the moderator ID', async () => {
      const document = { id: 1, author: authorId, name: 'Test Document' };

      const { newIds } = await trackNotifications(() =>
        NotificationService.notifyAuthor(
          document,
          moderatorId,
          NOTIFICATION_TYPES.VALIDATE,
          null
        )
      );

      should(newIds).have.length(1);
      const notification = await TNotification.findOne({ id: newIds[0] });
      should(notification.notifier).equal(moderatorId);
    });

    it('should return early when document has no author', async () => {
      const document = { id: 1, name: 'Test Document' };

      const { newIds, result } = await trackNotifications(() =>
        NotificationService.notifyAuthor(
          document,
          moderatorId,
          NOTIFICATION_TYPES.VALIDATE,
          null
        )
      );

      should(result).equal(true);
      should(newIds).have.length(0);
    });

    it('should send email when author has sendNotificationByEmail: true', async () => {
      await TCaver.updateOne({ id: authorId }).set({
        sendNotificationByEmail: true,
      });

      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().returns({
          intercept: sinon.stub().resolves(),
        }),
      });

      const document = { id: 1, author: authorId, name: 'Test Document' };

      const { newIds } = await trackNotifications(() =>
        NotificationService.notifyAuthor(
          document,
          moderatorId,
          NOTIFICATION_TYPES.REJECT,
          'Missing references'
        )
      );

      should(newIds).have.length(1);
      should(sails.helpers.sendEmail.with.calledOnce).be.true();

      const callArgs = sails.helpers.sendEmail.with.firstCall.args[0];
      should(callArgs.viewValues.isAuthorNotification).equal(true);
      should(callArgs.viewValues.validationComment).equal('Missing references');
    });

    it('should not send email when author has sendNotificationByEmail: false', async () => {
      await TCaver.updateOne({ id: authorId }).set({
        sendNotificationByEmail: false,
      });

      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().returns({
          intercept: sinon.stub().resolves(),
        }),
      });

      const document = { id: 1, author: authorId, name: 'Test Document' };

      const { newIds } = await trackNotifications(() =>
        NotificationService.notifyAuthor(
          document,
          moderatorId,
          NOTIFICATION_TYPES.VALIDATE,
          null
        )
      );

      should(newIds).have.length(1);
      should(sails.helpers.sendEmail.with.called).be.false();
    });
  });

  describe('notifyMessageRecipient()', () => {
    let sender;
    let recipient;
    let conversation;
    let sendEmailStub;

    before(async () => {
      sender = await TCaver.create({
        activated: true,
        mailIsValid: true,
        nickname: 'SenderCaver',
        mail: 'sender.msg@test.com',
        login: 'sender_msg_login',
        password: 'argon2_hashed_password_mock',
      }).fetch();

      recipient = await TCaver.create({
        activated: true,
        mailIsValid: true,
        nickname: 'RecipientCaver',
        mail: 'recipient.msg@test.com',
        login: 'recipient_msg_login',
        password: 'argon2_hashed_password_mock',
        sendMessageNotificationByEmail: true,
      }).fetch();

      conversation = await MessageService.createConversation(
        sender.id,
        recipient.id
      );
    });

    after(async () => {
      await sails.sendNativeQuery(
        'DELETE FROM j_participant WHERE id_conversation = $1',
        [conversation.id]
      );
      await TConversation.destroy({ id: conversation.id });
      await TCaver.destroy({ id: [sender.id, recipient.id] });
    });

    afterEach(() => {
      if (sendEmailStub) {
        sendEmailStub.restore();
        sendEmailStub = null;
      }
    });

    it('should send email notification to the recipient of the message', async () => {
      let emailSentArgs = null;
      sendEmailStub = sinon.stub(sails.helpers, 'sendEmail').value({
        with: sinon.stub().callsFake((args) => {
          emailSentArgs = args;
          return {
            intercept: sinon.stub().resolves(),
          };
        }),
      });

      await NotificationService.notifyMessageRecipient(
        sender.id,
        conversation.id
      );

      should(sails.helpers.sendEmail.with.calledOnce).be.true();
      should(emailSentArgs).not.be.null();
      should(emailSentArgs.emailSubject).be.equal('New Message');
      should(emailSentArgs.recipientEmail).be.equal(recipient.mail);
      should(emailSentArgs.viewName).be.equal('new-message');
      should(emailSentArgs.viewValues.senderNickname).be.equal(sender.nickname);
      should(emailSentArgs.viewValues.recipientName).be.equal(
        recipient.nickname
      );
    });

    it('should successfully render the new-message email template without errors', async () => {
      const errorLogSpy = sinon.spy(sails.log, 'error');

      try {
        await NotificationService.notifyMessageRecipient(
          sender.id,
          conversation.id
        );

        const errorCalls = errorLogSpy
          .getCalls()
          .filter(
            (call) =>
              call.args[0] &&
              typeof call.args[0] === 'string' &&
              call.args[0].includes('notifyMessageRecipient')
          );
        should(errorCalls).have.length(0);
      } finally {
        errorLogSpy.restore();
      }
    });
  });
});
