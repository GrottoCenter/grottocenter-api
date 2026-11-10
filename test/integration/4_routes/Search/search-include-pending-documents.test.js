/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

// Opting in to the documents awaiting validation, anonymous callers included (#1561)
describe('Search - includePendingDocuments', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  // No Authorization header: the option is open to anonymous callers
  const post = (url, body) =>
    supertest(sails.hooks.http.app)
      .post(url)
      .send(body)
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

  const emptyResult = {
    hits: [],
    found: 0,
    out_of: 0,
    page: 1,
    request_params: { collection_name: 'documents' },
  };
  const emptyFacets = { found: 0, found_docs: 0, grouped_hits: [], page: 1 };

  const ENDPOINTS = [
    {
      url: '/api/v1/search',
      method: 'multiCollectionsSearch',
      result: emptyResult,
      body: { query: 'karst', entities: ['documents'] },
    },
    {
      url: '/api/v1/advanced-search',
      method: 'collectionSearch',
      result: emptyResult,
      body: { entity: 'documents', query: 'karst' },
    },
    {
      url: '/api/v1/advanced-search/export',
      method: 'collectionSearch',
      result: emptyResult,
      body: {
        entity: 'documents',
        query: 'karst',
        columns: ['title'],
        columnsName: ['Title'],
      },
    },
    {
      url: '/api/v1/field-search',
      method: 'fieldSearch',
      result: emptyFacets,
      body: { entity: 'documents', field: 'type', query: 'a' },
    },
  ];

  ENDPOINTS.forEach(({ url, method, result, body }) => {
    describe(`POST ${url}`, () => {
      it('leaves the pending documents out when the option is omitted', async () => {
        const stub = sinon.stub(SearchService, method).resolves(result);

        const res = await post(url, body);

        should(res.status).equal(200);
        should(stub.callCount).equal(1);
        should(stub.firstCall.args[0].includePendingDocuments).be.false();
      });

      it('passes a JSON boolean through', async () => {
        const stub = sinon.stub(SearchService, method).resolves(result);

        const res = await post(url, { ...body, includePendingDocuments: true });

        should(res.status).equal(200);
        should(stub.firstCall.args[0].includePendingDocuments).be.true();
      });

      it('turns a string into a boolean', async () => {
        const stub = sinon.stub(SearchService, method).resolves(result);

        const res = await post(url, {
          ...body,
          includePendingDocuments: '0',
        });

        should(res.status).equal(200);
        should(stub.firstCall.args[0].includePendingDocuments).be.false();
      });

      it('keeps the option apart from the filter', async () => {
        const stub = sinon.stub(SearchService, method).resolves(result);

        const res = await post(url, {
          ...body,
          filter: { type: 'Article' },
          matchAllFields: false,
          includePendingDocuments: 'true',
        });

        should(res.status).equal(200);
        should(stub.firstCall.args[0].filter).eql({ type: 'Article' });
        should(stub.firstCall.args[0].includePendingDocuments).be.true();
      });

      it('rejects a value that is not a boolean', async () => {
        const stub = sinon.stub(SearchService, method);

        const res = await post(url, {
          ...body,
          includePendingDocuments: 'yes',
        });

        should(res.status).equal(400);
        should(res.body.metadata).eql({
          field: 'includePendingDocuments',
          value: 'yes',
        });
        should(stub.callCount).equal(0);
      });
    });
  });

  it('labels the pending documents of the results', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      ...emptyResult,
      hits: [
        { document: { id: '1', validationStatus: 'validated' } },
        { document: { id: '2', validationStatus: 'pending' } },
        { document: { id: '3', validationStatus: 'modificationPending' } },
      ],
      found: 3,
    });

    const res = await post('/api/v1/advanced-search', {
      entity: 'documents',
      includePendingDocuments: true,
    });

    should(res.status).equal(200);
    should(res.body.results.map((r) => r.validationStatus)).eql([
      'validated',
      'pending',
      'modificationPending',
    ]);
  });
});
