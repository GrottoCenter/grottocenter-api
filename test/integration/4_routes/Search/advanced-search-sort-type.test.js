/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

describe('Advanced Search - sort parameter type handling', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should not crash when sort is an empty object', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', name: 'Cave A' } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'caves' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'caves', sort: {} })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);

    // sort should be ignored (passed as undefined to service)
    const callArgs = SearchService.collectionSearch.firstCall.args[0];
    should(callArgs.sort).be.undefined();
  });

  it('should not crash when sort is a number', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', name: 'Cave A' } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'caves' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'caves', sort: 123 })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);

    const callArgs = SearchService.collectionSearch.firstCall.args[0];
    should(callArgs.sort).be.undefined();
  });

  it('should not crash when sort is an array', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', name: 'Cave A' } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'caves' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'caves', sort: ['name:asc'] })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);

    const callArgs = SearchService.collectionSearch.firstCall.args[0];
    should(callArgs.sort).be.undefined();
  });

  it('should still work correctly with a valid string sort', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', name: 'Cave A' } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'caves' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'caves', sort: 'name:asc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);

    const callArgs = SearchService.collectionSearch.firstCall.args[0];
    should(callArgs.sort).equal('name:asc');
  });

  it('should ignore sort when it is null', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', name: 'Cave A' } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'caves' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'caves', sort: null })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);

    const callArgs = SearchService.collectionSearch.firstCall.args[0];
    should(callArgs.sort).be.undefined();
  });
});
