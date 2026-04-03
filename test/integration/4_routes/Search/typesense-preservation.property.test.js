/* eslint-disable func-names, global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');
const fc = require('fast-check');

/**
 * Preservation — Property 2: Non-4xx Behavior Unchanged
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 *
 * These tests capture baseline behavior on UNFIXED code. They must PASS
 * both before and after the fix, confirming no regressions.
 */
describe('Preservation — Non-4xx behavior unchanged on search endpoints', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  // --- 3.1 Valid search returns 200 ---

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

  // --- 3.3 Typesense 5xx returns 500 ---

  describe('Typesense 5xx returns 500', () => {
    it('POST /api/v1/advanced-search returns 500 for Typesense 5xx', function () {
      this.timeout(30000);

      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 500, max: 599 }),
          async (httpStatus) => {
            sinon.restore();
            const error = new Error('Server error');
            error.httpStatus = httpStatus;
            sinon.stub(SearchService, 'collectionSearch').rejects(error);

            const res = await supertest(sails.hooks.http.app)
              .post('/api/v1/advanced-search')
              .send({ query: 'test', entity: 'entrances' })
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json');

            should(res.status).equal(500);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('POST /api/v1/search returns 500 for Typesense 5xx', function () {
      this.timeout(30000);

      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 500, max: 599 }),
          async (httpStatus) => {
            sinon.restore();
            const error = new Error('Server error');
            error.httpStatus = httpStatus;
            sinon.stub(SearchService, 'multiCollectionsSearch').rejects(error);

            const res = await supertest(sails.hooks.http.app)
              .post('/api/v1/search')
              .send({ query: 'test' })
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json');

            should(res.status).equal(500);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('POST /api/v1/field-search returns 500 for Typesense 5xx', function () {
      this.timeout(30000);

      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 500, max: 599 }),
          async (httpStatus) => {
            sinon.restore();
            const error = new Error('Server error');
            error.httpStatus = httpStatus;
            sinon.stub(SearchService, 'fieldSearch').rejects(error);

            const res = await supertest(sails.hooks.http.app)
              .post('/api/v1/field-search')
              .send({ field: 'name', entity: 'caves', query: 'test' })
              .set('Content-type', 'application/json')
              .set('Accept', 'application/json');

            should(res.status).equal(500);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('POST /api/v1/advanced-search/export returns 500 for Typesense 5xx', function () {
      this.timeout(30000);

      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 500, max: 599 }),
          async (httpStatus) => {
            sinon.restore();
            const error = new Error('Server error');
            error.httpStatus = httpStatus;
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
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // --- Typesense 401/403 auth errors return 500 (not leaked as 400) ---

  describe('Typesense auth errors (401, 403) return 500', () => {
    it('POST /api/v1/advanced-search returns 500 for Typesense 401/403', function () {
      this.timeout(30000);

      return fc.assert(
        fc.asyncProperty(fc.constantFrom(401, 403), async (httpStatus) => {
          sinon.restore();
          const error = new Error('Unauthorized');
          error.httpStatus = httpStatus;
          sinon.stub(SearchService, 'collectionSearch').rejects(error);

          const res = await supertest(sails.hooks.http.app)
            .post('/api/v1/advanced-search')
            .send({ query: 'test', entity: 'entrances' })
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json');

          should(res.status).equal(500);
        }),
        { numRuns: 10 }
      );
    });
  });

  // --- 3.5, 3.6 Input validation returns 400 ---

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
