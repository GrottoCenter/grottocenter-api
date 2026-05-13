/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

describe('Advanced Search - dataQuality sort validation', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should sort entrances by dataQuality:asc and return ascending order', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [
        { document: { id: '1', name: 'Low Quality', dataQuality: 10 } },
        { document: { id: '2', name: 'Medium Quality', dataQuality: 50 } },
        { document: { id: '3', name: 'High Quality', dataQuality: 90 } },
      ],
      found: 3,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'entrances' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'entrances', sort: 'dataQuality:asc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
    should(res.body).have.property('results');
    should(res.body.results).be.an.Array();
    should(res.body.results.length).equal(3);

    // Verify ascending order
    should(res.body.results[0].dataQuality).equal(10);
    should(res.body.results[1].dataQuality).equal(50);
    should(res.body.results[2].dataQuality).equal(90);

    // Verify sort was passed to SearchService
    const callArgs = SearchService.collectionSearch.firstCall.args[0];
    should(callArgs.sort).equal('dataQuality:asc');
  });

  it('should sort entrances by dataQuality:desc and return descending order', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [
        { document: { id: '3', name: 'High Quality', dataQuality: 90 } },
        { document: { id: '2', name: 'Medium Quality', dataQuality: 50 } },
        { document: { id: '1', name: 'Low Quality', dataQuality: 10 } },
      ],
      found: 3,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'entrances' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'entrances', sort: 'dataQuality:desc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
    should(res.body).have.property('results');
    should(res.body.results).be.an.Array();
    should(res.body.results.length).equal(3);

    // Verify descending order
    should(res.body.results[0].dataQuality).equal(90);
    should(res.body.results[1].dataQuality).equal(50);
    should(res.body.results[2].dataQuality).equal(10);

    // Verify sort was passed to SearchService
    const callArgs = SearchService.collectionSearch.firstCall.args[0];
    should(callArgs.sort).equal('dataQuality:desc');
  });

  it('should return 400 when sorting by dataQuality on a non-entrance entity', async () => {
    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'caves', sort: 'dataQuality:desc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(400);
  });

  it('should return 400 when sorting by dataQuality on massifs entity', async () => {
    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'massifs', sort: 'dataQuality:asc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(400);
  });

  it('should return 400 when sorting by dataQuality on documents entity', async () => {
    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'documents', sort: 'dataQuality:desc' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(400);
  });

  it('should allow sorting by other fields on non-entrance entities', async () => {
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
  });

  it('should return 400 when dataQuality appears in a multi-field sort on non-entrance entity', async () => {
    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'caves',
        sort: '_text_match:desc,dataQuality:asc',
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(400);
  });

  it('should allow dataQuality in a multi-field sort on entrances entity', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', name: 'Entrance A', dataQuality: 50 } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'entrances' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        sort: '_text_match:desc,dataQuality:asc',
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
  });
});
