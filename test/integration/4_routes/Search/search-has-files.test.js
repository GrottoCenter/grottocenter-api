/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

// Filtering and sorting documents on an attached file (#1739)
describe('Search - hasFiles filter and sort', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

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

  describe('POST /api/v1/advanced-search', () => {
    it('passes a JSON boolean hasFiles filter through', async () => {
      const stub = sinon
        .stub(SearchService, 'collectionSearch')
        .resolves(emptyResult);

      const res = await post('/api/v1/advanced-search', {
        entity: 'documents',
        filter: { hasFiles: false },
      });

      should(res.status).equal(200);
      should(stub.callCount).equal(1);
      should(stub.firstCall.args[0].filter).eql({ hasFiles: false });
    });

    it('turns a string hasFiles filter into a boolean', async () => {
      const stub = sinon
        .stub(SearchService, 'collectionSearch')
        .resolves(emptyResult);

      const res = await post('/api/v1/advanced-search', {
        entity: 'documents',
        filter: { hasFiles: 'true', type: 'Article' },
      });

      should(res.status).equal(200);
      should(stub.firstCall.args[0].filter).eql({
        hasFiles: true,
        type: 'Article',
      });
    });

    it('rejects a hasFiles filter that is not a boolean', async () => {
      const stub = sinon.stub(SearchService, 'collectionSearch');

      const res = await post('/api/v1/advanced-search', {
        entity: 'documents',
        filter: { hasFiles: 'yes' },
      });

      should(res.status).equal(400);
      should(res.body.metadata).eql({ field: 'filter.hasFiles', value: 'yes' });
      should(stub.callCount).equal(0);
    });

    it('sorts documents on hasFiles', async () => {
      const stub = sinon
        .stub(SearchService, 'collectionSearch')
        .resolves(emptyResult);

      const res = await post('/api/v1/advanced-search', {
        entity: 'documents',
        sort: 'hasFiles:desc',
      });

      should(res.status).equal(200);
      should(stub.firstCall.args[0].sort).equal('hasFiles:desc');
    });

    it('rejects a hasFiles sort on another entity', async () => {
      const stub = sinon.stub(SearchService, 'collectionSearch');

      const res = await post('/api/v1/advanced-search', {
        entity: 'entrances',
        sort: 'hasFiles:desc',
      });

      should(res.status).equal(400);
      should(stub.callCount).equal(0);
    });
  });

  describe('POST /api/v1/field-search', () => {
    it('turns a string hasFiles filter into a boolean', async () => {
      const stub = sinon.stub(SearchService, 'fieldSearch').resolves({
        found: 0,
        found_docs: 0,
        grouped_hits: [],
        page: 1,
      });

      const res = await post('/api/v1/field-search', {
        entity: 'documents',
        field: 'type',
        filter: { hasFiles: '0' },
      });

      should(res.status).equal(200);
      should(stub.firstCall.args[0].filter).eql({ hasFiles: false });
    });

    it('rejects a hasFiles filter that is not a boolean', async () => {
      const stub = sinon.stub(SearchService, 'fieldSearch');

      const res = await post('/api/v1/field-search', {
        entity: 'documents',
        field: 'type',
        filter: { hasFiles: 'maybe' },
      });

      should(res.status).equal(400);
      should(stub.callCount).equal(0);
    });
  });

  describe('POST /api/v1/advanced-search/export', () => {
    it('turns a string hasFiles filter into a boolean', async () => {
      const stub = sinon
        .stub(SearchService, 'collectionSearch')
        .resolves(emptyResult);

      const res = await post('/api/v1/advanced-search/export', {
        entity: 'documents',
        columns: ['title'],
        columnsName: ['Title'],
        filter: { hasFiles: 'true' },
      });

      should(res.status).equal(200);
      should(stub.firstCall.args[0].filter).eql({ hasFiles: true });
    });

    it('rejects a hasFiles filter that is not a boolean', async () => {
      const stub = sinon.stub(SearchService, 'collectionSearch');

      const res = await post('/api/v1/advanced-search/export', {
        entity: 'documents',
        columns: ['title'],
        columnsName: ['Title'],
        filter: { hasFiles: 'yes' },
      });

      should(res.status).equal(400);
      should(stub.callCount).equal(0);
    });
  });
});
