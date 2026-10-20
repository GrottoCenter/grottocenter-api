const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

const NOTIFICATION_PROPERTIES = [
  'id',
  'dateInscription',
  'dateReadAt',
  'notified',
  'notifier',
  'entity',
];

describe('Notifications features', () => {
  let adminToken;
  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Find all', () => {
    const findAll = () =>
      supertest(sails.hooks.http.app)
        .get('/api/v1/notifications')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(206);

    it('should return code 206', async () => {
      const res = await findAll();
      const { notifications } = res.body;
      for (const notification of notifications) {
        should(notification).have.properties(NOTIFICATION_PROPERTIES);
      }
    });

    it('should describe a permanently deleted entity through its snapshot', async () => {
      const res = await findAll();
      // Fixture 5: a PERMANENT_DELETE whose comment is gone
      const notification = res.body.notifications.find((n) => n.id === 5);
      should(notification.notificationType.name).equal('PERMANENT_DELETE');
      should(notification.comment).be.null();
      should(notification.entity).eql({
        type: 'comment',
        id: 987654,
        name: 'A comment that is gone',
        parent: { type: 'entrance', id: 1 },
      });
    });

    it('should leave entity null on a notification created without a snapshot', async () => {
      const res = await findAll();
      // Fixture 1: an UPDATE of entrance 1, still populated the usual way
      const notification = res.body.notifications.find((n) => n.id === 1);
      should(notification.entrance.id).equal(1);
      should(notification.entity).be.null();
    });
  });
});
