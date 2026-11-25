/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');
const { fieldNames, useLiveFields } = require('../../../helpers/searchIndex');

/**
 * A Typesense 4xx normally means the caller sent a bad request: 400. When it
 * comes from a stale index (the deploy added a field, the resync has not run),
 * it is our fault and must be a server error. See docs/health-monitoring.md.
 *
 * The messages below are the ones Typesense 29 sends (checked on a scratch
 * collection): the guard only converts errors that name a missing field of a
 * searched collection, or say that collection is not found.
 */
const MISSING_FILTER_FIELD =
  'Could not find a filter field named `validationStatus` in the schema.';
const UNRELATED_FILTER_FIELD =
  'Could not find a filter field named `colour` in the schema.';

describe('Typesense 4xx on a stale search index', () => {
  let typesense;
  let SearchService;
  let retrieveFieldNames;

  before(() => {
    typesense = require('../../../../config/typesense');
    SearchService = require('../../../../api/services/SearchService');
  });

  const staleIndex = (missing = { documents: ['validationStatus'] }) =>
    useLiveFields(retrieveFieldNames, missing);

  const typesenseError = (status, message = MISSING_FILTER_FIELD) =>
    Object.assign(new Error(message), { httpStatus: status });

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
      stubTypesense: (code, message = MISSING_FILTER_FIELD) =>
        sinon.stub(typesense, 'multiSearch').resolves({ code, error: message }),
    },
    {
      url: '/api/v1/advanced-search',
      body: { query: 'test', entity: 'documents' },
      stubTypesense: (code, message) =>
        sinon.stub(typesense, 'search').rejects(typesenseError(code, message)),
    },
    {
      url: '/api/v1/field-search',
      body: { field: 'type', entity: 'documents', query: 'test' },
      stubTypesense: (code, message) =>
        sinon.stub(typesense, 'search').rejects(typesenseError(code, message)),
    },
  ];

  ENDPOINTS.forEach(({ url, body, stubTypesense }) => {
    describe(`POST ${url}`, () => {
      it('returns 500 when the error names a missing field', async () => {
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
        should(res.body).have.property('error', MISSING_FILTER_FIELD);
      });

      it('keeps the 400 for an unrelated error during a stale window', async () => {
        staleIndex();
        stubTypesense(400, UNRELATED_FILTER_FIELD);

        const res = await post(url, body);

        should(res.status).equal(400);
        should(res.body).have.property('error', UNRELATED_FILTER_FIELD);
      });

      it('keeps the 400 when only another collection is stale', async () => {
        staleIndex({ caves: ['validationStatus'] });
        stubTypesense(400);

        const res = await post(url, body);

        should(res.status).equal(400);
      });

      it('keeps the 400 when the index cannot be checked', async () => {
        retrieveFieldNames.rejects(new Error('timeout'));
        stubTypesense(400);

        const res = await post(url, body);

        should(res.status).equal(400);
      });
    });
  });

  it('returns 500 when a searched collection does not exist', async () => {
    retrieveFieldNames.callsFake(async (name) =>
      name === 'documents' ? null : fieldNames(name)
    );
    sinon
      .stub(typesense, 'multiSearch')
      .resolves({ code: 404, error: '`documents` collection not found.' });

    const res = await post('/api/v1/search', {
      query: 'test',
      entities: ['documents'],
    });

    should(res.status).equal(500);
  });

  // collectionSearch also backs the devices search and the export: the guard
  // is not specific to documents.
  it('GET /api/v1/devices/search returns 500 on a stale devices collection', async () => {
    staleIndex({ devices: ['brandName'] });
    sinon
      .stub(typesense, 'search')
      .rejects(
        typesenseError(
          400,
          'Could not find a field named `brandName` in the schema for sorting.'
        )
      );

    const res = await supertest(sails.hooks.http.app)
      .get('/api/v1/devices/search')
      .query({ query: 'test' })
      .set('Accept', 'application/json');

    should(res.status).equal(500);
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
