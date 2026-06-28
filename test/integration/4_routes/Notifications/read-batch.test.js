const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');

describe('Notifications batch mark-as-read', () => {
  let adminToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  afterEach(async () => {
    // Reset all notifications to their fixture state
    await TNotification.updateOne(1).set({ dateReadAt: null });
    await TNotification.updateOne(2).set({ dateReadAt: null });
    await TNotification.updateOne(3).set({
      dateReadAt: new Date('2022-09-01T12:05:52Z'),
    });
    await TNotification.updateOne(4).set({ dateReadAt: null });
  });

  describe('PUT /api/v1/notifications/read — mark all', () => {
    it('should return 401 when not authenticated', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/notifications/read')
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(401, done);
    });

    it('should return 204 and mark all unread notifications as read when body is empty', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/notifications/read')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(204);

      // Verify admin's unread notifications are now read
      const n1 = await TNotification.findOne(1);
      const n2 = await TNotification.findOne(2);
      should(n1.dateReadAt).not.be.null();
      should(n2.dateReadAt).not.be.null();

      // Verify notification belonging to another user is untouched
      const n4 = await TNotification.findOne(4);
      should(n4.dateReadAt).be.null();
    });

    it('should return 204 and mark all unread notifications as read when ids is empty array', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/notifications/read')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ ids: [] })
        .expect(204);

      const n1 = await TNotification.findOne(1);
      const n2 = await TNotification.findOne(2);
      should(n1.dateReadAt).not.be.null();
      should(n2.dateReadAt).not.be.null();
    });
  });

  describe('PUT /api/v1/notifications/read — mark by IDs', () => {
    it('should return 204 and mark only specified notifications as read', async () => {
      await supertest(sails.hooks.http.app)
        .put('/api/v1/notifications/read')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ ids: [1] })
        .expect(204);

      const n1 = await TNotification.findOne(1);
      should(n1.dateReadAt).not.be.null();

      // Notification 2 (also admin's, unread) should remain unread
      const n2 = await TNotification.findOne(2);
      should(n2.dateReadAt).be.null();
    });

    it('should return 403 when any ID does not belong to the authenticated user', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/notifications/read')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ ids: [1, 4] }) // ID 4 belongs to caver 2
        .expect(403, done);
    });

    it('should return 403 when a non-existent ID is provided', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/notifications/read')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ ids: [1, 999999] })
        .expect(403, done);
    });

    it('should be idempotent — already-read notifications are silently skipped', async () => {
      // Notification 3 is already read in fixtures
      await supertest(sails.hooks.http.app)
        .put('/api/v1/notifications/read')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ ids: [3] })
        .expect(204);

      const n3 = await TNotification.findOne(3);
      should(n3.dateReadAt).not.be.null();
    });

    it('should return 400 when ids contains invalid values', (done) => {
      supertest(sails.hooks.http.app)
        .put('/api/v1/notifications/read')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ ids: [-1, 'abc'] })
        .expect(400, done);
    });

    it('should return 400 when ids array exceeds maximum length', (done) => {
      const tooManyIds = Array.from({ length: 1001 }, (_, i) => i + 1);
      supertest(sails.hooks.http.app)
        .put('/api/v1/notifications/read')
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .send({ ids: tooManyIds })
        .expect(400, done);
    });
  });
});
