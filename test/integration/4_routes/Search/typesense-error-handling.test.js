/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

/**
 * Typesense 4xx errors return HTTP 400 to the client.
 *
 * Replaces the former property-based tests (typesense-error-handling.property.test.js)
 * that fired hundreds of HTTP requests via fc.asyncProperty, causing socket
 * hang ups under load. The property tests explored random httpStatus values in
 * the 4xx range; these conventional tests cover the same failure modes with
 * representative boundary values (400, 404, 422, 499) plus the auth-error
 * partition (401, 403 → 500) that the property tests also verified.
 *
 * Coverage trade-off: we lose randomized exploration of the full 400–499 range,
 * but the underlying code uses a simple `>= 400 && < 500` check, so boundary
 * values are sufficient. The mid-stream error test covers the streaming export
 * edge case that property tests could not reliably exercise.
 */
describe('Typesense 4xx errors on search endpoints', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  const CLIENT_ERRORS = [
    { status: 400, label: 'Bad Request' },
    { status: 404, label: 'Not Found' },
    { status: 422, label: 'Unprocessable Entity' },
    { status: 499, label: 'upper boundary' },
  ];

  CLIENT_ERRORS.forEach(({ status, label }) => {
    it(`POST /api/v1/advanced-search returns 400 for Typesense ${status} (${label})`, async () => {
      const error = new Error(`Typesense ${status}`);
      error.httpStatus = status;
      sinon.stub(SearchService, 'collectionSearch').rejects(error);

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search')
        .send({ query: 'test', entity: 'entrances' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(400);
      should(res.body).have.property('error', `Typesense ${status}`);
    });

    it(`POST /api/v1/search returns 400 for Typesense ${status} (${label})`, async () => {
      const error = new Error(`Typesense ${status}`);
      error.httpStatus = status;
      sinon.stub(SearchService, 'multiCollectionsSearch').rejects(error);

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/search')
        .send({ query: 'test' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(400);
      should(res.body).have.property('error', `Typesense ${status}`);
    });

    it(`POST /api/v1/field-search returns 400 for Typesense ${status} (${label})`, async () => {
      const error = new Error(`Typesense ${status}`);
      error.httpStatus = status;
      sinon.stub(SearchService, 'fieldSearch').rejects(error);

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/field-search')
        .send({ field: 'name', entity: 'caves', query: 'test' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(400);
      should(res.body).have.property('error', `Typesense ${status}`);
    });

    it(`POST /api/v1/advanced-search/export returns 400 for Typesense ${status} (${label})`, async () => {
      const error = new Error(`Typesense ${status}`);
      error.httpStatus = status;
      sinon.stub(SearchService, 'collectionSearch').rejects(error);

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'entrances',
          columns: ['id'],
          columnsName: ['ID'],
        })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(400);
      should(res.body).have.property('error', `Typesense ${status}`);
    });
  });

  it('POST /api/v1/advanced-search/export terminates cleanly on mid-stream 4xx error', async () => {
    const error = new Error('mid-stream error');
    error.httpStatus = 400;

    const stub = sinon.stub(SearchService, 'collectionSearch');
    stub.onFirstCall().resolves({
      hits: Array.from({ length: 1000 }, (_, i) => ({
        document: { id: String(i) },
      })),
      found: 2000,
    });
    stub.onSecondCall().rejects(error);

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search/export')
      .send({
        query: 'test',
        entity: 'entrances',
        columns: ['id'],
        columnsName: ['ID'],
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    // Headers already sent with CSV content-type, so status is 200
    should(res.status).equal(200);
    should(res.text).startWith('\uFEFF');
    should(res.text).containEql('ID');
  });

  // Auth errors (401, 403) are server config issues — should not leak as 400
  it('POST /api/v1/advanced-search returns 500 for Typesense 401 (server config issue)', async () => {
    const error = new Error('Unauthorized');
    error.httpStatus = 401;
    sinon.stub(SearchService, 'collectionSearch').rejects(error);

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'entrances' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    // 401/403 from Typesense are NOT client errors — they should return 500
    should(res.status).equal(500);
  });

  it('POST /api/v1/advanced-search returns 500 for Typesense 403', async () => {
    const error = new Error('Forbidden');
    error.httpStatus = 403;
    sinon.stub(SearchService, 'collectionSearch').rejects(error);

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'entrances' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(500);
  });
});
