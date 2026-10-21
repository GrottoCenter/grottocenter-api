const supertest = require('supertest');
const should = require('should');
const AuthTokenService = require('../../AuthTokenService');
const deleteIsPermanentCases = require('../../deleteIsPermanentCases');

describe('Comment delete', () => {
  let userToken;
  let moderatorToken;
  let adminToken;
  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  describe('Delete', () => {
    it('should return 403 when user is not a moderator', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/comments/1')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(403, done);
    });

    it('should return 404 when comment does not exist', (done) => {
      supertest(sails.hooks.http.app)
        .delete('/api/v1/comments/999999')
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should soft delete a comment', async () => {
      const comment = await TComment.create({
        author: 1,
        title: 'Test',
        body: 'Test',
        entrance: 1,
      }).fetch();

      const res = await supertest(sails.hooks.http.app)
        .delete(`/api/v1/comments/${comment.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      should(res.body.isDeleted).be.true();
    });

    it('should handle already deleted comment', async () => {
      const comment = await TComment.create({
        author: 1,
        title: 'Test',
        body: 'Test',
        entrance: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/comments/${comment.id}`)
        .set('Authorization', moderatorToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
    });

    it('should permanently delete a comment', async () => {
      const comment = await TComment.create({
        author: 1,
        title: 'Test',
        body: 'Test',
        entrance: 1,
        isDeleted: true,
      }).fetch();

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/comments/${comment.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);

      const deleted = await TComment.findOne(comment.id);
      should(deleted).be.undefined();
    });
  });

  describe('Permanent delete notification', () => {
    // User1 subscribes to the region of entrance 2 for the duration of the
    // test: the admin who deletes is never notified of their own action
    const USER1_ID = 3;
    const REGION = 'FR-01';
    const createdNotificationIds = [];

    before(async () => {
      await TCaver.addToCollection(USER1_ID, 'subscribedToRegions', [REGION]);
    });

    after(async () => {
      await TCaver.removeFromCollection(USER1_ID, 'subscribedToRegions', [
        REGION,
      ]);
      if (createdNotificationIds.length > 0) {
        await TNotification.destroy({ id: createdNotificationIds });
      }
    });

    it('should tell the subscribers what was permanently deleted', async () => {
      const comment = await TComment.create({
        author: 1,
        title: 'Doomed comment',
        body: 'Soon permanently deleted',
        entrance: 2,
      }).fetch();
      const beforeIds = (await TNotification.find().select(['id'])).map(
        (n) => n.id
      );

      await supertest(sails.hooks.http.app)
        .delete(`/api/v1/comments/${comment.id}?isPermanent=true`)
        .set('Authorization', adminToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200);
      should(await TComment.findOne(comment.id)).be.undefined();

      const newIds = (await TNotification.find().select(['id']))
        .map((n) => n.id)
        .filter((id) => !beforeIds.includes(id));
      createdNotificationIds.push(...newIds);
      const rows = await TNotification.find({ id: newIds, notified: USER1_ID });
      should(rows).have.length(1);
      // No comment row left to reference: the snapshot is all that is kept
      should(rows[0].comment).be.null();
      const expectedEntity = {
        type: 'comment',
        id: comment.id,
        name: 'Doomed comment',
        parent: { type: 'entrance', id: 2 },
      };
      should(rows[0].entitySnapshot).eql(expectedEntity);

      const res = await supertest(sails.hooks.http.app)
        .get('/api/v1/notifications')
        .set('Authorization', userToken)
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json')
        .expect(206);
      const notification = res.body.notifications.find(
        (n) => n.id === rows[0].id
      );
      should(notification.notificationType.name).equal('PERMANENT_DELETE');
      should(notification.comment).be.null();
      should(notification.entity).eql(expectedEntity);
    });
  });

  deleteIsPermanentCases({
    getToken: () => adminToken,

    getModeratorToken: () => moderatorToken,
    getModel: () => TComment,
    createEntity: () =>
      TComment.create({
        author: 1,
        title: 'Test',
        body: 'Test',
        entrance: 1,
      }).fetch(),
    deleteUrl: (id) => `/api/v1/comments/${id}`,
    findEntity: (id) => TComment.findOne(id),
    observe: 'notification',
  });
});
