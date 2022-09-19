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
  });
});
