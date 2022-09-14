const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

const NOTIFICATION_PROPERTIES = [
  'id',
  'dateInscription',
  'dateReadAt',
  'notified',
  'notifier',
];

describe('Notifications features', () => {
  let adminToken;
  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Count unread', () => {
    it('should return code 200', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/notifications')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const { notifications } = res.body;
          should(notifications).have.length(3);
          for (const notification of notifications) {
            should(notification).have.properties(NOTIFICATION_PROPERTIES);
          }
          return done();
        });
    });
  });
});
