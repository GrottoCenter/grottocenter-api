/* eslint-disable func-names, global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');
const fc = require('fast-check');

/**
 * Bug Condition Exploration — Property 1: Typesense 4xx errors return HTTP 400
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 *
 * For any Typesense error with httpStatus in [400, 499] (excluding auth errors
 * 401/403 which are server config issues), the API should return HTTP 400 with
 * the error message.
 */
describe('Bug Condition — Typesense 4xx errors on search endpoints', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('POST /api/v1/advanced-search returns 400 for Typesense 4xx errors', function () {
    this.timeout(30000);

    return fc.assert(
      fc.asyncProperty(
        fc
          .integer({ min: 400, max: 499 })
          .filter((s) => s !== 401 && s !== 403),
        fc.string({ minLength: 1 }),
        async (httpStatus, message) => {
          sinon.restore();
          const error = new Error(message);
          error.httpStatus = httpStatus;
          sinon.stub(SearchService, 'collectionSearch').rejects(error);

          const res = await supertest(sails.hooks.http.app)
            .post('/api/v1/advanced-search')
            .send({ query: 'test', entity: 'entrances' })
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json');

          should(res.status).equal(
            400,
            `Expected 400 for httpStatus ${httpStatus}, got ${res.status}`
          );
          should(res.body).have.property('error', message);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('POST /api/v1/search returns 400 for Typesense 4xx errors', function () {
    this.timeout(30000);

    return fc.assert(
      fc.asyncProperty(
        fc
          .integer({ min: 400, max: 499 })
          .filter((s) => s !== 401 && s !== 403),
        fc.string({ minLength: 1 }),
        async (httpStatus, message) => {
          sinon.restore();
          const error = new Error(message);
          error.httpStatus = httpStatus;
          sinon.stub(SearchService, 'multiCollectionsSearch').rejects(error);

          const res = await supertest(sails.hooks.http.app)
            .post('/api/v1/search')
            .send({ query: 'test' })
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json');

          should(res.status).equal(
            400,
            `Expected 400 for httpStatus ${httpStatus}, got ${res.status}`
          );
          should(res.body).have.property('error', message);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('POST /api/v1/field-search returns 400 for Typesense 4xx errors', function () {
    this.timeout(30000);

    return fc.assert(
      fc.asyncProperty(
        fc
          .integer({ min: 400, max: 499 })
          .filter((s) => s !== 401 && s !== 403),
        fc.string({ minLength: 1 }),
        async (httpStatus, message) => {
          sinon.restore();
          const error = new Error(message);
          error.httpStatus = httpStatus;
          sinon.stub(SearchService, 'fieldSearch').rejects(error);

          const res = await supertest(sails.hooks.http.app)
            .post('/api/v1/field-search')
            .send({ field: 'name', entity: 'caves', query: 'test' })
            .set('Content-type', 'application/json')
            .set('Accept', 'application/json');

          should(res.status).equal(
            400,
            `Expected 400 for httpStatus ${httpStatus}, got ${res.status}`
          );
          should(res.body).have.property('error', message);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('POST /api/v1/advanced-search/export returns 400 for Typesense 4xx errors (no headers sent)', function () {
    this.timeout(30000);

    return fc.assert(
      fc.asyncProperty(
        fc
          .integer({ min: 400, max: 499 })
          .filter((s) => s !== 401 && s !== 403),
        fc.string({ minLength: 1 }),
        async (httpStatus, message) => {
          sinon.restore();
          const error = new Error(message);
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

          should(res.status).equal(
            400,
            `Expected 400 for httpStatus ${httpStatus}, got ${res.status}`
          );
          should(res.body).have.property('error', message);
        }
      ),
      { numRuns: 20 }
    );
  });

  // Issue #7: Test mid-stream 4xx in export endpoint
  it('POST /api/v1/advanced-search/export terminates cleanly on mid-stream 4xx error', function () {
    this.timeout(30000);

    return fc.assert(
      fc.asyncProperty(
        fc
          .integer({ min: 400, max: 499 })
          .filter((s) => s !== 401 && s !== 403),
        fc.string({ minLength: 1 }),
        async (httpStatus, message) => {
          sinon.restore();
          const error = new Error(message);
          error.httpStatus = httpStatus;

          // First call succeeds (headers get sent), second call throws 4xx
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

          // Response should be 200 (headers already sent with CSV content-type)
          should(res.status).equal(200);
          // The stream should have ended cleanly (no crash, no corruption)
          should(res.text).startWith('\uFEFF');
          should(res.text).containEql('ID');
        }
      ),
      { numRuns: 10 }
    );
  });
});
