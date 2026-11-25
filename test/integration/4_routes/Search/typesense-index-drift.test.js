/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');
const { useLiveFields } = require('../../../helpers/searchIndex');

/**
 * A Typesense 4xx normally means the caller sent a bad request: 400. When it
 * comes from a stale index (the deploy added a field, the resync has not run),
 * it is our fault and must be a server error. See docs/health-monitoring.md.
 */
describe('Typesense 4xx on a stale search index', () => {
  let typesense;
  let SearchService;
  let retrieveFieldNames;

  before(() => {
    typesense = require('../../../../config/typesense');
    SearchService = require('../../../../api/services/SearchService');
  });

  const staleIndex = () =>
    useLiveFields(retrieveFieldNames, { documents: ['validationStatus'] });

  const typesenseError = (status) =>
    Object.assign(new Error(`Typesense ${status}`), { httpStatus: status });

  beforeEach(() => {
    SearchService.clearIndexSchemaCache();
    retrieveFieldNames = sinon.stub(typesense, 'retrieveFieldNames');
    useLiveFields(retrieveFieldNames);
  });

  afterEach(() => {
    SearchService.clearIndexSchemaCache();
    sinon.restore();
  });

  const post = (url, body) =>
    supertest(sails.hooks.http.app)
      .post(url)
      .send(body)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

  const ENDPOINTS = [
    {
      url: '/api/v1/search',
      body: { query: 'test', entities: ['documents'] },
      // A union multi-search answers 200 with the error in the body
      stubTypesense: (code) =>
        sinon
          .stub(typesense, 'multiSearch')
          .resolves({ code, error: `Typesense ${code}` }),
    },
    {
      url: '/api/v1/advanced-search',
      body: { query: 'test', entity: 'documents' },
      stubTypesense: (code) =>
        sinon.stub(typesense, 'search').rejects(typesenseError(code)),
    },
    {
      url: '/api/v1/field-search',
      body: { field: 'type', entity: 'documents', query: 'test' },
      stubTypesense: (code) =>
        sinon.stub(typesense, 'search').rejects(typesenseError(code)),
    },
  ];

  ENDPOINTS.forEach(({ url, body, stubTypesense }) => {
    describe(`POST ${url}`, () => {
      it('returns 500 when the index is out of date', async () => {
        staleIndex();
        stubTypesense(400);

        const res = await post(url, body);

        should(res.status).equal(500);
        should(JSON.stringify(res.body)).not.containEql('validationStatus');
      });

      it('keeps the 400 when the index is up to date', async () => {
        stubTypesense(400);

        const res = await post(url, body);

        should(res.status).equal(400);
        should(res.body).have.property('error', 'Typesense 400');
      });

      it('keeps the 400 when the index cannot be checked', async () => {
        retrieveFieldNames.rejects(new Error('timeout'));
        stubTypesense(400);

        const res = await post(url, body);

        should(res.status).equal(400);
      });
    });
  });

  it('does not check the index for a Typesense 5xx', async () => {
    staleIndex();
    sinon.stub(typesense, 'search').rejects(typesenseError(503));

    const res = await post('/api/v1/advanced-search', {
      query: 'test',
      entity: 'documents',
    });

    should(res.status).equal(500);
    should(retrieveFieldNames.called).be.false();
  });

  [401, 403].forEach((status) => {
    it(`does not check the index for a Typesense ${status}`, async () => {
      staleIndex();
      sinon.stub(typesense, 'search').rejects(typesenseError(status));

      await post('/api/v1/advanced-search', {
        query: 'test',
        entity: 'documents',
      });

      should(retrieveFieldNames.called).be.false();
    });
  });
});
