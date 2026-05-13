/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

describe('Advanced Search - dataQuality in entrance results', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return dataQuality integer field between 0 and 100 for each entrance result', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [
        { document: { id: '1', name: 'Entrance A', dataQuality: 75 } },
        { document: { id: '2', name: 'Entrance B', dataQuality: 0 } },
        { document: { id: '3', name: 'Entrance C', dataQuality: 100 } },
      ],
      found: 3,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'entrances' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'entrances' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
    should(res.body).have.property('results');
    should(res.body.results).be.an.Array();
    should(res.body.results.length).equal(3);

    res.body.results.forEach((result) => {
      should(result).have.property('dataQuality');
      should(result.dataQuality).be.a.Number();
      should(Number.isInteger(result.dataQuality)).be.true();
      should(result.dataQuality).be.greaterThanOrEqual(0);
      should(result.dataQuality).be.lessThanOrEqual(100);
    });

    // Verify specific values
    should(res.body.results[0].dataQuality).equal(75);
    should(res.body.results[1].dataQuality).equal(0);
    should(res.body.results[2].dataQuality).equal(100);
  });

  it('should default dataQuality to 0 when dataQuality is 0 in Typesense document', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [
        {
          document: {
            id: '1',
            name: 'Entrance without quality',
            dataQuality: 0,
          },
        },
      ],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'entrances' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'entrances' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
    should(res.body.results[0]).have.property('dataQuality');
    should(res.body.results[0].dataQuality).equal(0);
  });

  it('should return dataQuality as a top-level property of each entrance result', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', name: 'Test Entrance', dataQuality: 42 } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'entrances' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'entrances' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
    const entrance = res.body.results[0];
    // dataQuality should be a top-level integer, not nested
    should(entrance.dataQuality).equal(42);
    should(entrance.dataQuality).be.a.Number();
  });
});
