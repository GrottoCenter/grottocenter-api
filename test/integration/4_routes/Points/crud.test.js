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
      underground: true,
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
    await JPointDocumentPosition.destroy({ point: createdPointIds });
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

    it('returns 400 without an explicit underground value', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({ label: 'P' })
      ).expect(400);
    });

    it('returns 400 for a surface point without coordinates', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({ label: 'P', underground: false })
      ).expect(400);
    });

    it('returns 400 for an incomplete coordinate pair', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({ label: 'P', underground: true, latitude: 45 })
      ).expect(400);
    });

    it('returns 400 for the former single-position fields', async () => {
      await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({
            label: 'P',
            underground: true,
            referenceDocumentId: planDocumentId,
            x: 1,
            y: 2,
          })
      ).expect(400);
    });

    it('creates an underground point without coordinates', async () => {
      const res = await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({ label: '  Lac terminal  ', caveId: 1, underground: true })
      ).expect(200);
      createdPointIds.push(res.body.id);
      should(res.body).match({
        label: 'Lac terminal',
        caveId: 1,
        underground: true,
        latitude: null,
        longitude: null,
        positions: [],
        positionCount: 0,
        documents: [],
        isDeleted: false,
      });
      should(res.body.author).have.property('nickname', 'User1');
    });

    it('creates a surface point at latitude 0 and longitude 0', async () => {
      const res = await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({
            label: 'Resurgence',
            underground: false,
            latitude: 0,
            longitude: 0,
          })
      ).expect(200);
      createdPointIds.push(res.body.id);
      should(res.body).match({ underground: false, latitude: 0, longitude: 0 });

      const stored = await TPoint.findOne({ id: res.body.id });
      should(stored.underground).equal(false);
      should(Number(stored.latitude)).equal(0);
      should(Number(stored.longitude)).equal(0);
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

    it('returns the point with its positions and its documents', async () => {
      const point = await createPoint();
      await JPointDocumentPosition.create({
        point: point.id,
        document: planDocumentId,
        x: 10,
        y: 20,
        dateInscription: new Date(),
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
        should(res.body).match({ id: point.id, positionCount: 1 });
        should(res.body.positions).have.length(1);
        should(res.body.positions[0]).match({
          pointId: point.id,
          documentId: planDocumentId,
          x: 10,
          y: 20,
        });
        should(res.body.documents.map((d) => d.id)).deepEqual([linked.id]);
      } finally {
        await TDocument.destroy({ id: [linked.id, deletedLinked.id] });
      }
    });

    it('does not expose a position on a soft-deleted plan', async () => {
      const plan = await TDocument.create({
        author: 1,
        type: 13,
        license: 1,
        isDeleted: true,
      }).fetch();
      try {
        const point = await createPoint();
        await JPointDocumentPosition.create({
          point: point.id,
          document: plan.id,
          x: 1,
          y: 2,
          dateInscription: new Date(),
        });

        const res = await json(
          supertest(sails.hooks.http.app).get(`/api/v1/points/${point.id}`)
        ).expect(200);
        should(res.body).match({ positions: [], positionCount: 0 });
      } finally {
        await JPointDocumentPosition.destroy({ document: plan.id });
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
      ).expect(200);
      should(res.body).match({ page: 1, size: 50 });
      const ids = res.body.points.map((p) => p.id);
      should(ids).containEql(kept.id);
      should(ids).not.containEql(deleted.id);
      res.body.points.forEach((p) => should(p.caveId).equal(2));
    });

    it('paginates with page and size, in a stable id order', async () => {
      await Promise.all([1, 2, 3].map(() => createPoint({ cave: 3 })));
      const get = (page) =>
        json(
          supertest(sails.hooks.http.app).get(
            `/api/v1/points?caveId=3&page=${page}&size=2`
          )
        ).expect(200);

      // Other test files may leave points on this cave: walk every page.
      const first = await get(1);
      should(first.body).match({ page: 1, size: 2 });
      const { total } = first.body;
      should(total).be.aboveOrEqual(3);
      const ids = [...first.body.points.map((p) => p.id)];
      for (let page = 2; ids.length < total; page += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await get(page);
        should(res.body.points.length).be.within(1, 2);
        ids.push(...res.body.points.map((p) => p.id));
      }
      should(ids).deepEqual([...ids].sort((a, b) => a - b));
      should(new Set(ids).size).equal(total);
      const created = await TPoint.find({ cave: 3, isDeleted: false });
      should(ids).containDeep(created.map((p) => p.id));
    });

    it('returns 400 for a size over 100', async () => {
      await json(
        supertest(sails.hooks.http.app).get('/api/v1/points?size=101')
      ).expect(400);
    });

    it('returns 400 for page 0', async () => {
      await json(
        supertest(sails.hooks.http.app).get('/api/v1/points?page=0')
      ).expect(400);
    });

    it('returns 400 for an invalid caveId', async () => {
      await json(
        supertest(sails.hooks.http.app).get('/api/v1/points?caveId=abc')
      ).expect(400);
    });
  });

  describe('PATCH /api/v1/points/:id', () => {
    it('returns 401 without a token', async () => {
      const point = await createPoint();
      await json(
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/points/${point.id}`)
          .send({ label: 'New' })
      ).expect(401);
    });

    it('returns 404 for a deleted point', async () => {
      const point = await createPoint({ isDeleted: true });
      await json(
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({ label: 'New' })
      ).expect(404);
    });

    it('returns 400 for an empty body', async () => {
      const point = await createPoint();
      await json(
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({})
      ).expect(400);
    });

    it('changes the label and keeps the omitted fields', async () => {
      const point = await createPoint({
        cave: 1,
        underground: false,
        latitude: '45.5',
        longitude: '6.25',
      });
      const res = await json(
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({ label: 'Renamed' })
      ).expect(200);
      should(res.body).match({
        label: 'Renamed',
        caveId: 1,
        underground: false,
        latitude: 45.5,
        longitude: 6.25,
      });
      should(res.body.reviewer).have.property('nickname', 'User1');
    });

    it('stores underground false and a coordinate 0', async () => {
      const point = await createPoint({ underground: null });
      const res = await json(
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({ underground: false, latitude: 0, longitude: 12 })
      ).expect(200);
      should(res.body).match({
        underground: false,
        latitude: 0,
        longitude: 12,
      });
    });

    it('returns 400 when the result would be a surface point without coordinates', async () => {
      const point = await createPoint({ underground: true });
      await json(
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({ underground: false })
      ).expect(400);
      const stored = await TPoint.findOne({ id: point.id });
      should(stored.underground).equal(true);
    });

    it('keeps the positions of the point', async () => {
      const point = await createPoint();
      await JPointDocumentPosition.create({
        point: point.id,
        document: planDocumentId,
        x: 1,
        y: 1,
        dateInscription: new Date(),
      });
      const res = await json(
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({ label: 'Moved label' })
      ).expect(200);
      should(res.body.positionCount).equal(1);
    });

    it('is not routed as PUT any more', async () => {
      const point = await createPoint();
      await json(
        supertest(sails.hooks.http.app)
          .put(`/api/v1/points/${point.id}`)
          .set('Authorization', userToken)
          .send({ label: 'New' })
      ).expect(404);
    });
  });

  describe('Geometry of a point', () => {
    // The stored point_geom, as { lng, lat }, or null
    const readGeometry = async (pointId) => {
      const { rows } = await sails.sendNativeQuery(
        `SELECT ST_X(point_geom) AS lng, ST_Y(point_geom) AS lat
         FROM t_point WHERE id = $1`,
        [pointId]
      );
      return rows[0].lng === null ? null : rows[0];
    };

    const patch = (pointId, body) =>
      json(
        supertest(sails.hooks.http.app)
          .patch(`/api/v1/points/${pointId}`)
          .set('Authorization', userToken)
          .send(body)
      ).expect(200);

    it('is set on creation, moved with the coordinates and cleared with them', async () => {
      const res = await json(
        supertest(sails.hooks.http.app)
          .post('/api/v1/points')
          .set('Authorization', userToken)
          .send({
            label: 'Georeferenced',
            underground: true,
            latitude: 45.5,
            longitude: 6.25,
          })
      ).expect(200);
      const pointId = res.body.id;
      createdPointIds.push(pointId);
      should(await readGeometry(pointId)).eql({ lng: 6.25, lat: 45.5 });

      await patch(pointId, { latitude: -12.5, longitude: 0 });
      should(await readGeometry(pointId)).eql({ lng: 0, lat: -12.5 });

      await patch(pointId, { latitude: null, longitude: null });
      should(await readGeometry(pointId)).be.null();
    });

    it('is left unchanged by an update that does not touch the coordinates', async () => {
      const point = await createPoint({ latitude: '10', longitude: '20' });
      await patch(point.id, { label: 'Only the label' });
      should(await readGeometry(point.id)).eql({ lng: 20, lat: 10 });
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
