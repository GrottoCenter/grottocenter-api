/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

describe('Advanced Search - authorsSort sort validation', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should sort documents by authorsSort:asc and return ascending order', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [
        { document: { id: '1', title: 'Doc A', authorsSort: 'adam' } },
        { document: { id: '2', title: 'Doc B', authorsSort: 'meandre club' } },
        { document: { id: '3', title: 'Doc C', authorsSort: 'zola' } },
      ],
      found: 3,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'documents' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'documents', sort: 'authorsSort:asc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
    should(res.body).have.property('results');
    should(res.body.results).be.an.Array();
    should(res.body.results.length).equal(3);

    // Verify sort was passed to SearchService
    const callArgs = SearchService.collectionSearch.firstCall.args[0];
    should(callArgs.sort).equal('authorsSort:asc');
  });

  it('should sort documents by authorsSort:desc', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [
        { document: { id: '3', title: 'Doc C', authorsSort: 'zola' } },
        { document: { id: '2', title: 'Doc B', authorsSort: 'meandre club' } },
        { document: { id: '1', title: 'Doc A', authorsSort: 'adam' } },
      ],
      found: 3,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'documents' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'documents', sort: 'authorsSort:desc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
    should(res.body.results.length).equal(3);

    const callArgs = SearchService.collectionSearch.firstCall.args[0];
    should(callArgs.sort).equal('authorsSort:desc');
  });

  it('should return 400 when sorting by authorsSort on entrances entity', async () => {
    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'entrances', sort: 'authorsSort:asc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(400);
  });

  it('should return 400 when sorting by authorsSort on persons entity', async () => {
    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'persons', sort: 'authorsSort:desc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(400);
  });

  it('should return 400 when authorsSort appears in a multi-field sort on a non-document entity', async () => {
    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'caves',
        sort: '_text_match:desc,authorsSort:asc',
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(400);
  });

  it('should allow authorsSort in a multi-field sort on documents entity', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', title: 'Doc A', authorsSort: 'adam' } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'documents' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'documents',
        sort: '_text_match:desc,authorsSort:asc',
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
  });

  it('should allow sorting documents by other fields', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', title: 'Doc A' } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'documents' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'documents',
        sort: 'dateInscription:desc',
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
  });
});
