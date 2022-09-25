const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

describe('Notifications features', () => {
  let adminToken;
  const ownNotificationId = 1;
  const otherNotificationId = 4;
  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  after(async () => {
    // Unread read notification
    await TNotification.updateOne(ownNotificationId).set({ dateReadAt: null });
  });

  describe('Mark as read', () => {
    it('should return code 404 on trying to mark an inexisting notification as read', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/notifications/987654321/read`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
    it('should return code 403 on trying to mark another user notification as read', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/notifications/${otherNotificationId}/read`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });
    it('should return code 204', (done) => {
      supertest(sails.hooks.http.app)
        .post(`/api/v1/notifications/${ownNotificationId}/read`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204, done);
    });
  });
});
