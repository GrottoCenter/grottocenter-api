const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

const json = (req) =>
  req.set('Content-type', 'application/json').set('Accept', 'application/json');

describe('Point positions features', () => {
  let userToken;
  let moderatorToken;
  let planId;
  let sectionId;
  let articleId;
  const createdPointIds = [];
  const createdDocumentIds = [];

  const createPoint = async (data = {}) => {
    const point = await TPoint.create({
      label: 'Positioned point',
      author: 1,
      underground: true,
      ...data,
    }).fetch();
    createdPointIds.push(point.id);
    return point;
  };

  const createDocument = async (data) => {
    const document = await TDocument.create({
      author: 1,
      license: 1,
      ...data,
    }).fetch();
    createdDocumentIds.push(document.id);
    return document;
  };

  const putPosition = (pointId, documentId, body, token = userToken) => {
    const req = supertest(sails.hooks.http.app)
      .put(`/api/v1/points/${pointId}/positions/${documentId}`)
      .send(body);
    return json(token ? req.set('Authorization', token) : req);
  };

  const deletePosition = (pointId, documentId, token = userToken) => {
    const req = supertest(sails.hooks.http.app).delete(
      `/api/v1/points/${pointId}/positions/${documentId}`
    );
    return json(token ? req.set('Authorization', token) : req);
  };

  before(async () => {
    userToken = await AuthTokenService.getRawBearerUserToken();
    moderatorToken = await AuthTokenService.getRawBearerModeratorToken();
    // A plan and a section of the same cave: both topographic drawings.
    planId = (await createDocument({ type: 13 })).id;
    sectionId = (await createDocument({ type: 13 })).id;
    articleId = (await createDocument({ type: 1 })).id;
  });

  after(async () => {
    await JPointDocumentPosition.destroy({ point: createdPointIds });
    await TFile.destroy({ document: createdDocumentIds });
    await TPoint.destroy({ id: createdPointIds });
    await TDocument.destroy({ id: createdDocumentIds });
  });

  describe('PUT /api/v1/points/:id/positions/:documentId', () => {
    it('returns 401 without a token', async () => {
      const point = await createPoint();
      await putPosition(point.id, planId, { x: 1, y: 2 }, null).expect(401);
    });

    it('returns 404 for an unknown or deleted point', async () => {
      await putPosition(999999, planId, { x: 1, y: 2 }).expect(404);
      const deleted = await createPoint({ isDeleted: true });
      await putPosition(deleted.id, planId, { x: 1, y: 2 }).expect(404);
    });

    it('returns 404 for an unknown document', async () => {
      const point = await createPoint();
      await putPosition(point.id, 999999, { x: 1, y: 2 }).expect(404);
    });

    it('returns 400 for a document that is not a plan', async () => {
      const point = await createPoint();
      await putPosition(point.id, articleId, { x: 1, y: 2 }).expect(400);
    });

    it('returns 400 for missing or non-numeric coordinates', async () => {
      const point = await createPoint();
      await putPosition(point.id, planId, { x: 1 }).expect(400);
      await putPosition(point.id, planId, { x: '1', y: 2 }).expect(400);
      should(await JPointDocumentPosition.count({ point: point.id })).equal(0);
    });

    it('creates a position at 0, 0', async () => {
      const point = await createPoint();
      const res = await putPosition(point.id, planId, { x: 0, y: 0 }).expect(
        200
      );
      should(res.body).match({
        pointId: point.id,
        documentId: planId,
        x: 0,
        y: 0,
      });
    });

    it('replaces the position on the same document, idempotently', async () => {
      const point = await createPoint();
      await putPosition(point.id, planId, { x: 1, y: 2 }).expect(200);
      await putPosition(point.id, planId, { x: 30.5, y: -4 }).expect(200);
      await putPosition(point.id, planId, { x: 30.5, y: -4 }).expect(200);

      const rows = await JPointDocumentPosition.find({ point: point.id });
      should(rows).have.length(1);
      should(rows[0]).match({ document: planId, x: 30.5, y: -4 });
    });

    it('keeps one row under concurrent requests', async () => {
      const point = await createPoint();
      await Promise.all(
        [1, 2, 3].map((x) => putPosition(point.id, planId, { x, y: 0 }))
      );
      should(await JPointDocumentPosition.count({ point: point.id })).equal(1);
    });

    it('positions one point on a plan and a section without replacing either', async () => {
      const point = await createPoint();
      await putPosition(point.id, planId, { x: 10, y: 20 }).expect(200);
      await putPosition(point.id, sectionId, { x: 300, y: 5 }).expect(200);

      const res = await json(
        supertest(sails.hooks.http.app).get(
          `/api/v1/points/${point.id}/positions`
        )
      ).expect(200);
      should(res.body).match({ page: 1, size: 50, total: 2 });
      should(
        res.body.positions.map(({ documentId, x, y }) => ({
          documentId,
          x,
          y,
        }))
      ).deepEqual([
        { documentId: planId, x: 10, y: 20 },
        { documentId: sectionId, x: 300, y: 5 },
      ]);

      const detail = await json(
        supertest(sails.hooks.http.app).get(`/api/v1/points/${point.id}`)
      ).expect(200);
      should(detail.body.positionCount).equal(2);
      should(detail.body.positions.map((p) => p.documentId)).deepEqual([
        planId,
        sectionId,
      ]);

      const [onPlan, onSection] = await Promise.all(
        [planId, sectionId].map((id) =>
          json(
            supertest(sails.hooks.http.app).get(
              `/api/v1/documents/${id}/points`
            )
          ).expect(200)
        )
      );
      should(onPlan.body.points).containEql({
        pointId: point.id,
        label: 'Positioned point',
        x: 10,
        y: 20,
      });
      should(onSection.body.points).containEql({
        pointId: point.id,
        label: 'Positioned point',
        x: 300,
        y: 5,
      });
    });
  });

  describe('DELETE /api/v1/points/:id/positions/:documentId', () => {
    it('returns 401 without a token', async () => {
      const point = await createPoint();
      await deletePosition(point.id, planId, null).expect(401);
    });

    it('returns 404 when the point has no position on the document', async () => {
      const point = await createPoint();
      await deletePosition(point.id, planId).expect(404);
    });

    it('removes only the position on that document', async () => {
      const point = await createPoint();
      await putPosition(point.id, planId, { x: 1, y: 2 }).expect(200);
      await putPosition(point.id, sectionId, { x: 3, y: 4 }).expect(200);

      await deletePosition(point.id, planId).expect(204);

      const rows = await JPointDocumentPosition.find({ point: point.id });
      should(rows.map((r) => r.document)).deepEqual([sectionId]);
    });
  });

  describe('GET /api/v1/points/:id/positions', () => {
    it('returns 404 for an unknown point', async () => {
      await json(
        supertest(sails.hooks.http.app).get('/api/v1/points/999999/positions')
      ).expect(404);
    });

    it('hides the positions of a deleted point from an anonymous visitor', async () => {
      const point = await createPoint({ isDeleted: true });
      await json(
        supertest(sails.hooks.http.app).get(
          `/api/v1/points/${point.id}/positions`
        )
      ).expect(404);
      await json(
        supertest(sails.hooks.http.app)
          .get(`/api/v1/points/${point.id}/positions`)
          .set('Authorization', moderatorToken)
      ).expect(200);
    });

    it('paginates with page and size', async () => {
      const point = await createPoint();
      await putPosition(point.id, planId, { x: 1, y: 1 }).expect(200);
      await putPosition(point.id, sectionId, { x: 2, y: 2 }).expect(200);

      const res = await json(
        supertest(sails.hooks.http.app).get(
          `/api/v1/points/${point.id}/positions?page=2&size=1`
        )
      ).expect(200);
      should(res.body).match({ page: 2, size: 1, total: 2 });
      should(res.body.positions.map((p) => p.documentId)).deepEqual([
        sectionId,
      ]);
    });

    it('returns 400 for an invalid size', async () => {
      const point = await createPoint();
      await json(
        supertest(sails.hooks.http.app).get(
          `/api/v1/points/${point.id}/positions?size=0`
        )
      ).expect(400);
    });
  });

  describe('Replacement of the SVG file of a document', () => {
    let FileSvc;
    before(() => {
      // Resolved after the lift: the controllers call this instance.
      // eslint-disable-next-line global-require
      FileSvc = require('../../../../api/services/FileService');
    });

    afterEach(() => {
      sinon.restore();
    });

    const createFile = (documentId, fileName, isValidated) =>
      TFile.create({
        dateInscription: new Date(),
        fileName,
        document: documentId,
        fileFormat: 1,
        path: `${Date.now()}-${Math.random()}-${fileName}`,
        isValidated,
      }).fetch();

    it('keeps the positions when a moderator validates a new SVG in place of the old one', async () => {
      const plan = await createDocument({ type: 13, isValidated: true });
      const oldSvg = await createFile(plan.id, 'plan-v1.svg', true);
      // Uploaded with the modification, validated with it.
      const newSvg = await createFile(plan.id, 'plan-v2.svg', false);
      const point = await createPoint();
      await putPosition(point.id, plan.id, { x: 42, y: 7.5 }).expect(200);

      await TDocument.updateOne(plan.id).set({
        modifiedDocJson: {
          reviewerId: 2,
          documentData: { type: 13 },
          descriptionData: {},
          deletedFiles: [{ id: oldSvg.id }],
          modifiedFiles: [],
          newFiles: [{ id: newSvg.id }],
        },
      });
      const deleteStorage = sinon
        .stub(FileSvc.document, 'deleteStorage')
        .resolves();

      const res = await json(
        supertest(sails.hooks.http.app)
          .put('/api/v1/documents/validate')
          .set('Authorization', moderatorToken)
          .send({ documents: [{ id: plan.id, isValidated: 'true' }] })
      ).expect(200);
      should(res.body[0].status).equal('validated');
      should(deleteStorage.callCount).equal(1);
      should(await TFile.findOne(oldSvg.id)).be.undefined();

      const markers = await json(
        supertest(sails.hooks.http.app).get(
          `/api/v1/documents/${plan.id}/points`
        )
      ).expect(200);
      should(markers.body.points).deepEqual([
        { pointId: point.id, label: 'Positioned point', x: 42, y: 7.5 },
      ]);
    });
  });
});
