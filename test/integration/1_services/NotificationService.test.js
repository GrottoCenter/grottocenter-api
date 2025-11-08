const should = require('should');
const CaveService = require('../../../api/services/CaveService');
const NotificationService = require('../../../api/services/NotificationService');
const {
  NOTIFICATION_ENTITIES,
  NOTIFICATION_TYPES,
} = require('../../../api/services/NotificationService');

describe('NotificationService', () => {
  const fakeReq = {
    i18n: {
      __: (message) => message,
      getLocale: () => 'eng',
    },
  };
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
        fakeReq,
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
  });

  describe('notifySubscribers()', () => {
    let entrance2;
    let history1;
    let user3;
    const testBeginningDate = new Date();
    let initialNbOfNotifications;

    before(async () => {
      history1 = await THistory.findOne(1).populate('cave');
      await CaveService.setEntrances([history1.cave]);
      entrance2 = await TEntrance.findOne(2);
      user3 = await TCaver.findOne(3);
      initialNbOfNotifications = await TNotification.count();
    });
    after(async () => {
      await TNotification.destroy({
        dateInscription: { '>=': testBeginningDate },
      });
      const finalNbOfNotifications = await TNotification.count();
      should(finalNbOfNotifications).be.equal(initialNbOfNotifications);
    });

    it('should create a notification about the entrance for user 1 subscribed to the country FR', async () => {
      const res = await NotificationService.notifySubscribers(
        fakeReq,
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

    it('should create a notification about the cave history for user 1 subscribed to the massif with id 1', async () => {
      const res = await NotificationService.notifySubscribers(
        fakeReq,
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

    it('should create a notification about the entrance for user 1 subscribed to the region FR-01', async () => {
      const entrance = await TEntrance.findOne(2); // Has iso_3166_2: "FR-01"
      const res = await NotificationService.notifySubscribers(
        fakeReq,
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

    // Additional coverage tests
    it('should throw error for invalid notification entity in notifySubscribers', async () => {
      try {
        await NotificationService.notifySubscribers(
          fakeReq,
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
          fakeReq,
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
          fakeReq,
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
        fakeReq,
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
        fakeReq,
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
        fakeReq,
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
        fakeReq,
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
        fakeReq,
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
        fakeReq,
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
        fakeReq,
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
        fakeReq,
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
        fakeReq,
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
        fakeReq,
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
        fakeReq,
        comment,
        user3.id,
        NOTIFICATION_TYPES.CREATE,
        NOTIFICATION_ENTITIES.COMMENT
      );
      should(res).not.be.false();
    });
  });
});
