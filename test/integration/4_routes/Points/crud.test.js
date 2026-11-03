const should = require('should');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

const json = (req) =>
  req.set('Content-type', 'application/json').set('Accept', 'application/json');

describe('Point features', () => {
  let userToken;
  let moderatorToken;
  let planDocumentId;
  const createdPointIds = [];

  const createPoint = async (data = {}) => {
    const point = await TPoint.create({
      label: 'Fixture point',
      author: 1,
      ...data,
    }).fetch();
    createdPointIds.push(point.id);
    return point;
  };

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    const plan = await TDocument.create({
      author: 1,
      type: 13,
      license: 1,
    }).fetch();
    planDocumentId = plan.id;
  });

  after(async () => {
    await TDocument.update({ point: createdPointIds }).set({ point: null });
    await TPoint.destroy({ id: createdPointIds });
    await TDocument.destroy({ id: planDocumentId });
  });

  describe('POST /api/v1/points', () => {
    it('returns 401 without a token', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .send({ label: 'P' })
      ).expect(401);
    });

    it('returns 400 without a label', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({})
      ).expect(400);
    });

    it('returns 400 when x and y come without referenceDocumentId', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({ label: 'P', x: 1, y: 2 })
      ).expect(400);
    });

    it('returns 400 when the reference document is not a plan', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({ label: 'P', referenceDocumentId: 5, x: 1, y: 2 })
      ).expect(400);
    });

    it('creates a point without a position', async () => {
      const res = await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({ label: '  Lac terminal  ', caveId: 1 })
      ).expect(200);
      createdPointIds.push(res.body.id);
      should(res.body).match({
        label: 'Lac terminal',
        caveId: 1,
        referenceDocument: null,
        x: null,
        y: null,
        documents: [],
        isDeleted: false,
      });
      should(res.body.author).have.property('nickname', 'User1');
    });

    it('creates a point positioned on a plan', async () => {
      const res = await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({
            label: 'Siphon',
            referenceDocumentId: planDocumentId,
            x: 120.5,
            y: 48,
          })
      ).expect(200);
      createdPointIds.push(res.body.id);
      should(res.body).match({ label: 'Siphon', x: 120.5, y: 48 });
      should(res.body.referenceDocument).have.property('id', planDocumentId);

      const stored = await TPoint.findOne({ id: res.body.id });
      should(stored).match({
        referenceDocument: planDocumentId,
        x: 120.5,
        y: 48,
      });
    });
  });

  describe('GET /api/v1/points/:id', () => {
    it('returns 404 for an unknown point', async () => {
      await json(
        supertest(sails.hooks.http.app).get('/api/v1/points/999999')
      ).expect(404);
    });

    it('returns 404 for a deleted point to an anonymous visitor', async () => {
      const point = await createPoint({ isDeleted: true });
      await json(
        supertest(sails.hooks.http.app).get(`/api/v1/points/${point.id}`)
      ).expect(404);
    });

    it('returns a deleted point to a moderator', async () => {
      const point = await createPoint({ isDeleted: true });
      const res = await json(
        supertest(sails.hooks.http.app)
          .get(`/api/v1/points/${point.id}`)
          .set('Authorization', moderatorToken)
      ).expect(200);
      should(res.body).have.property('isDeleted', true);
    });

    it('returns the point with its position and its documents', async () => {
      const point = await createPoint({
        referenceDocument: planDocumentId,
        x: 10,
        y: 20,
      });
      const [linked, deletedLinked] = await Promise.all([
        TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          point: point.id,
        }).fetch(),
        TDocument.create({
          author: 1,
          type: 1,
          license: 1,
          point: point.id,
          isDeleted: true,
        }).fetch(),
      ]);
      try {
        const res = await json(
          supertest(sails.hooks.http.app).get(`/api/v1/points/${point.id}`)
        ).expect(200);
        should(res.body).match({ id: point.id, x: 10, y: 20 });
        should(res.body.referenceDocument).have.property('id', planDocumentId);
        should(res.body.documents.map((d) => d.id)).deepEqual([linked.id]);
      } finally {
        await TDocument.destroy({ id: [linked.id, deletedLinked.id] });
      }
    });

    it('does not expose a soft-deleted reference plan', async () => {
      const plan = await TDocument.create({
        author: 1,
        type: 13,
        license: 1,
      }).fetch();
      try {
        await TDescription.create({
          author: 1,
          document: plan.id,
          language: 'fra',
          title: 'Deleted plan',
          body: 'Secret body',
        });
        const point = await createPoint({
          referenceDocument: plan.id,
          x: 1,
          y: 2,
        });
        await TDocument.updateOne({ id: plan.id }).set({ isDeleted: true });

        const res = await json(
          supertest(sails.hooks.http.app).get(`/api/v1/points/${point.id}`)
        ).expect(200);
        should(res.body.referenceDocument).be.null();
        should(JSON.stringify(res.body)).not.containEql('Secret body');
      } finally {
        await TPoint.update({ referenceDocument: plan.id }).set({
          referenceDocument: null,
          x: null,
          y: null,
        });
        await TDescription.destroy({ document: plan.id });
        await TDocument.destroy({ id: plan.id });
      }
    });
  });

  describe('GET /api/v1/points', () => {
    it('lists the non-deleted points of a cave', async () => {
      const [kept, deleted] = await Promise.all([
        createPoint({ cave: 2 }),
        createPoint({ cave: 2, isDeleted: true }),
      ]);
      const res = await json(
        supertest(sails.hooks.http.app).get('/api/v1/points?caveId=2')
      ).expect(206); // paginated lists answer with a Content-Range
      should(res.headers).have.property('content-range');
      const ids = res.body.points.map((p) => p.id);
      should(ids).containEql(kept.id);
      should(ids).not.containEql(deleted.id);
      res.body.points.forEach((p) => should(p.caveId).equal(2));
    });

    it('returns 400 for an invalid limit', async () => {
      await json(
        supertest(sails.hooks.http.app).get('/api/v1/points?limit=0')
      ).expect(400);
    });

    it('returns 400 for an invalid caveId', async () => {
      await json(
        supertest(sails.hooks.http.app).get('/api/v1/points?caveId=abc')
      ).expect(400);
    });
  });

  describe('PUT /api/v1/points/:id', () => {
    it('returns 401 without a token', async () => {
      const point = await createPoint();
      await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${point.id}`)
          .send({ label: 'New' })
      ).expect(401);
    });

    it('returns 404 for a deleted point', async () => {
      const point = await createPoint({ isDeleted: true });
      await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({ label: 'New' })
      ).expect(404);
    });

    it('returns 400 for an empty body', async () => {
      const point = await createPoint();
      await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({})
      ).expect(400);
    });

    it('moves the point on its plan', async () => {
      const point = await createPoint({
        referenceDocument: planDocumentId,
        x: 1,
        y: 1,
      });
      const res = await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({ referenceDocumentId: planDocumentId, x: 33.3, y: 44.4 })
      ).expect(200);
      should(res.body).match({ label: 'Fixture point', x: 33.3, y: 44.4 });
      should(res.body.reviewer).have.property('nickname', 'User1');
    });

    it('clears the position', async () => {
      const point = await createPoint({
        referenceDocument: planDocumentId,
        x: 1,
        y: 1,
      });
      const res = await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({ referenceDocumentId: null, x: null, y: null })
      ).expect(200);
      should(res.body).match({ referenceDocument: null, x: null, y: null });
    });
  });

  describe('DELETE /api/v1/points/:id', () => {
    it('returns 403 for a regular user', async () => {
      const point = await createPoint();
      await json(
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
      ).expect(403);
    });

    it('returns 404 for an unknown point', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .delete('/api/v1/points/999999')
          .set('Authorization', moderatorToken)
      ).expect(404);
    });

    it('soft-deletes the point for an administrator', async () => {
      const point = await createPoint();
      const adminToken = await AuthTokenService.getRawBearerAdminToken();
      await json(
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/points/${point.id}`)
          .set('Authorization', adminToken)
      ).expect(200);
    });

    it('soft-deletes the point for a moderator', async () => {
      const point = await createPoint();
      const res = await json(
        supertest(sails.hooks.http.app)
          .delete(`/api/v1/points/${point.id}`)
          .set('Authorization', moderatorToken)
      ).expect(200);
      should(res.body).have.property('isDeleted', true);
      const stored = await TPoint.findOne({ id: point.id });
      should(stored).have.property('isDeleted', true);
    });
  });
});
