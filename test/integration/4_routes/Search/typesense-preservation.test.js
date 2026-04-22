/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

/**
 * Preservation tests — non-4xx behavior unchanged on search endpoints.
 *
 * Replaces the former property-based tests (typesense-preservation.property.test.js)
 * that used fc.asyncProperty with supertest, causing socket hang ups under load.
 * The property tests verified that valid searches still return 200 and that 5xx
 * errors are not accidentally caught by the 4xx handler. These conventional tests
 * cover the same three partitions:
 *   1. Valid search → 200 (all four search endpoints)
 *   2. Typesense 5xx → 500 (boundary values 500, 502, 503, 599)
 *   3. Input validation → 400 (missing required fields)
 *
 * Coverage trade-off: we lose randomized 5xx status exploration, but the code
 * path is a simple `>= 500` check — boundary values are sufficient.
 */
describe('Preservation — Non-4xx behavior unchanged on search endpoints', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  // --- Valid search returns 200 ---

  describe('Valid search returns 200', () => {
    it('POST /api/v1/advanced-search returns 200 for valid results', async () => {
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [{ document: { id: '1' } }],
        found: 1,
      });

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search')
        .send({ query: 'test', entity: 'entrances' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(200);
    });

    it('POST /api/v1/search returns 200 for valid results', async () => {
      sinon.stub(SearchService, 'multiCollectionsSearch').resolves({
        hits: [],
        found: 0,
      });

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/search')
        .send({ query: 'test' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(200);
    });

    it('POST /api/v1/field-search returns 200 for valid results', async () => {
      sinon.stub(SearchService, 'fieldSearch').resolves({
        found: 1,
        found_docs: 1,
        grouped_hits: [{ group_key: ['test'], found: 1 }],
        page: 1,
      });

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/field-search')
        .send({ field: 'name', entity: 'caves', query: 'test' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(200);
    });

    it('POST /api/v1/advanced-search/export returns 200 for valid results', async () => {
      sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [{ document: { id: '1', name: 'Test' } }],
        found: 1,
      });

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/advanced-search/export')
        .send({
          query: 'test',
          entity: 'entrances',
          columns: ['id', 'name'],
          columnsName: ['ID', 'Name'],
        })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(200);
    });
  });

  // --- Typesense 5xx returns 500 ---

  describe('Typesense 5xx returns 500', () => {
    const SERVER_ERRORS = [500, 502, 503, 599];

    SERVER_ERRORS.forEach((status) => {
      it(`POST /api/v1/advanced-search returns 500 for Typesense ${status}`, async () => {
        const error = new Error('Server error');
        error.httpStatus = status;
        sinon.stub(SearchService, 'collectionSearch').rejects(error);

        const res = await supertest(sails.hooks.http.app)
          .post('/api/v1/advanced-search')
          .send({ query: 'test', entity: 'entrances' })
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        should(res.status).equal(500);
      });
    });

    it('POST /api/v1/search returns 500 for Typesense 500', async () => {
      const error = new Error('Server error');
      error.httpStatus = 500;
      sinon.stub(SearchService, 'multiCollectionsSearch').rejects(error);

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/search')
        .send({ query: 'test' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(500);
    });

    it('POST /api/v1/field-search returns 500 for Typesense 500', async () => {
      const error = new Error('Server error');
      error.httpStatus = 500;
      sinon.stub(SearchService, 'fieldSearch').rejects(error);

      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/field-search')
        .send({ field: 'name', entity: 'caves', query: 'test' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(500);
    });

    it('POST /api/v1/advanced-search/export returns 500 for Typesense 500', async () => {
      const error = new Error('Server error');
      error.httpStatus = 500;
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

      should(res.status).equal(500);
    });
  });

  // --- Input validation returns 400 ---

  describe('Input validation returns 400', () => {
    it('POST /api/v1/search without query returns 400', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/search')
        .send({})
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(400);
      should(res.text).containEql('You must provide a query');
    });

    it('POST /api/v1/field-search without field returns 400', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/field-search')
        .send({ entity: 'caves' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(400);
    });

    it('POST /api/v1/field-search without entity returns 400', async () => {
      const res = await supertest(sails.hooks.http.app)
        .post('/api/v1/field-search')
        .send({ field: 'name' })
        .set('Content-type', 'application/json')
        .set('Accept', 'application/json');

      should(res.status).equal(400);
    });
  });
});
