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
      language: '000',
    }).fetch();

    userId = caver.id;
    userToken = TokenService.issue({ id: userId }, 3600, 'auth');
  });

  after(async () => {
    const TCaver = sails.models.tcaver;
    await TCaver.destroy({ id: userId });
  });

  describe('GET /api/v1/account/notifications', () => {
    it('should return current notification preferences', (done) => {
      supertest(sails.hooks.http.app)
        .get('/api/v1/account/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          should(res.body).have.property('alert_for_news', false);
          should(res.body).have.property('send_notification_by_email', false);
          should(res.body).have.property(
            'send_message_notification_by_email',
            true
          );
          done();
        });
    });
  });

  describe('PATCH /api/v1/account/notifications', () => {
    it('should partially update notification preferences', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ alert_for_news: true })
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          should(res.body).have.property('alert_for_news', true);
          should(res.body).have.property('send_notification_by_email', false);
          should(res.body).have.property(
            'send_message_notification_by_email',
            true
          );
          done();
        });
    });

    it('should completely update notification preferences', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          alert_for_news: false,
          send_notification_by_email: true,
          send_message_notification_by_email: false,
        })
        .expect(200)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          should(res.body).have.property('alert_for_news', false);
          should(res.body).have.property('send_notification_by_email', true);
          should(res.body).have.property(
            'send_message_notification_by_email',
            false
          );
          done();
        });
    });

    it('should return 400 if no preferences are provided', (done) => {
      supertest(sails.hooks.http.app)
        .patch('/api/v1/account/notifications')
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
