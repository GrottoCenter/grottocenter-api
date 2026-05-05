const supertest = require('supertest');
const should = require('should');
const TokenService = require('../../../../api/services/TokenService');

describe('Account - Notification Preferences', () => {
  let userToken;
  let userId;

  before(async () => {
    // We can reuse the first user from the DB or create a mock one.
    // Assuming `Tcaver` and `TokenService` are globally available via `sails` or we require them.
    const TCaver = sails.models.tcaver;

    const caver = await TCaver.create({
      nickname: 'NotificationUser',
      mail: 'notif@example.com',
      activated: true,
      alertForNews: false,
      sendNotificationByEmail: false,
      sendMessageNotificationByEmail: true,
    }).fetch();

    userId = caver.id;
    userToken = TokenService.issue({ id: userId }, 3600, 'auth');
  });

  after(async () => {
    const TCaver = sails.models.tcaver;
    await TCaver.destroy({ id: userId });
  });

  describe('GET /api/v1/account/notification-preferences', () => {
    it('should return current notification preferences', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/account/notification-preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          should(res.body).have.property('alertForNews', false);
          should(res.body).have.property('sendNotificationByEmail', false);
          should(res.body).have.property(
            'sendMessageNotificationByEmail',
            true
          );
          done();
        });
    });
  });

  describe('PATCH /api/v1/account/notification-preferences', () => {
    it('should partially update notification preferences', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account/notification-preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ alertForNews: true })
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          should(res.body).have.property('alertForNews', true);
          should(res.body).have.property('sendNotificationByEmail', false);
          should(res.body).have.property(
            'sendMessageNotificationByEmail',
            true
          );
          done();
        });
    });

    it('should completely update notification preferences', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account/notification-preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          alertForNews: false,
          sendNotificationByEmail: true,
          sendMessageNotificationByEmail: false,
        })
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          should(res.body).have.property('alertForNews', false);
          should(res.body).have.property('sendNotificationByEmail', true);
          should(res.body).have.property(
            'sendMessageNotificationByEmail',
            false
          );
          done();
        });
    });

    it('should return 400 if no preferences are provided', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account/notification-preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          should(res.text).containEql('No notification preferences provided');
          done();
        });
    });
  });
});
