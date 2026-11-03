const should = require('should');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

const json = (req) =>
  req.set('Content-type', 'application/json').set('Accept', 'application/json');

describe('Point documents features', () => {
  let userToken;
  let moderatorToken;
  let planId;
  let photoId;
  let pointId;
  let otherPointId;

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    const [plan, photo] = await Promise.all([
      TDocument.create({ author: 1, type: 13, license: 1 }).fetch(),
      TDocument.create({ author: 1, type: 1, license: 1 }).fetch(),
    ]);
    planId = plan.id;
    photoId = photo.id;
    const [point, otherPoint] = await Promise.all([
      TPoint.create({ label: 'Doc point', author: 1 }).fetch(),
      TPoint.create({ label: 'Other point', author: 1 }).fetch(),
    ]);
    pointId = point.id;
    otherPointId = otherPoint.id;
  });

  after(async () => {
    await TDocument.update({ id: [planId, photoId] }).set({ point: null });
    await TPoint.destroy({ id: [pointId, otherPointId] });
    await TDocument.destroy({ id: [planId, photoId] });
  });

  describe('PUT /api/v1/points/:pointId/documents/:documentId', () => {
    it('returns 401 without a token', async () => {
      await json(
        supertest(sails.hooks.http.app).put(
          `/api/v1/points/${pointId}/documents/${photoId}`
        )
      ).expect(401);
    });

    it('returns 404 for an unknown document', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${pointId}/documents/999999`)
          .set('Authorization', userToken)
      ).expect(404);
    });

    it('returns 404 for an unknown point', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/999999/documents/${photoId}`)
          .set('Authorization', userToken)
      ).expect(404);
    });

    it('links the document to the point, idempotently', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${pointId}/documents/${photoId}`)
          .set('Authorization', userToken)
      ).expect(204);
      await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${pointId}/documents/${photoId}`)
          .set('Authorization', userToken)
      ).expect(204);
      const document = await TDocument.findOne({ id: photoId });
      should(document.point).equal(pointId);
    });

    it('returns 409 when the document already references another point', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${otherPointId}/documents/${photoId}`)
          .set('Authorization', userToken)
      ).expect(409);
    });

    it('shows the point on the document details', async () => {
      const res = await json(
        supertest(sails.hooks.http.app).get(`/api/v1/documents/${photoId}`)
      ).expect(200);
      should(res.body.point).match({ id: pointId, label: 'Doc point' });
    });
  });

  describe('DELETE /api/v1/points/:pointId/documents/:documentId', () => {
    it('returns 403 for a regular user', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/points/${pointId}/documents/${photoId}`)
          .set('Authorization', userToken)
      ).expect(403);
    });

    it('returns 404 when the document does not reference the point', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/points/${otherPointId}/documents/${photoId}`)
          .set('Authorization', moderatorToken)
      ).expect(404);
    });

    it('unlinks the document for a moderator', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/points/${pointId}/documents/${photoId}`)
          .set('Authorization', moderatorToken)
      ).expect(204);
      const document = await TDocument.findOne({ id: photoId });
      should(document.point).be.null();
    });
  });

  describe('GET /api/v1/documents/:id/points', () => {
    let markedId;
    let deletedMarkedId;

    before(async () => {
      const [marked, deletedMarked] = await Promise.all([
        TPoint.create({
          label: 'Marker',
          author: 1,
          referenceDocument: planId,
          x: 5.5,
          y: 6.5,
        }).fetch(),
        TPoint.create({
          label: 'Deleted marker',
          author: 1,
          referenceDocument: planId,
          x: 1,
          y: 1,
          isDeleted: true,
        }).fetch(),
      ]);
      markedId = marked.id;
      deletedMarkedId = deletedMarked.id;
    });

    after(async () => {
      await TPoint.destroy({ id: [markedId, deletedMarkedId] });
    });

    it('returns 404 for an unknown document', async () => {
      await json(
        supertest(sails.hooks.http.app).get('/api/v1/documents/999999/points')
      ).expect(404);
    });

    it('returns the markers of the plan', async () => {
      const res = await json(
        supertest(sails.hooks.http.app).get(
          `/api/v1/documents/${planId}/points`
        )
      ).expect(200);
      should(res.body).deepEqual({
        points: [{ pointId: markedId, label: 'Marker', x: 5.5, y: 6.5 }],
      });
    });

    it('returns an empty list for a document without markers', async () => {
      const res = await json(
        supertest(sails.hooks.http.app).get(
          `/api/v1/documents/${photoId}/points`
        )
      ).expect(200);
      should(res.body).deepEqual({ points: [] });
    });
  });
});
