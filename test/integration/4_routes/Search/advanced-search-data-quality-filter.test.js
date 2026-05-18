/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

describe('Advanced Search - dataQuality filter normalization', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  const stubCollectionSearch = () => {
    const stub = sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [{ document: { id: '1', name: 'Entrance A', dataQuality: 50 } }],
      found: 1,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'entrances' },
    });
    return stub;
  };

  it('should pass normalized [min, max] filter to SearchService', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        filter: { dataQuality: [20, 80] },
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter).have.property('dataQuality');
    should(callArgs.filter.dataQuality).deepEqual([20, 80]);
  });

  it('should replace null min with 0', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        filter: { dataQuality: [null, 75] },
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter.dataQuality).deepEqual([0, 75]);
  });

  it('should replace null max with 100', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        filter: { dataQuality: [30, null] },
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter.dataQuality).deepEqual([30, 100]);
  });

  it('should handle single-element array [min] as [min, 100]', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        filter: { dataQuality: [50] },
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter.dataQuality).deepEqual([50, 100]);
  });

  it('should clamp values below 0 to 0', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        filter: { dataQuality: [-50, 80] },
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter.dataQuality).deepEqual([0, 80]);
  });

  it('should clamp values above 100 to 100', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        filter: { dataQuality: [20, 200] },
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter.dataQuality).deepEqual([20, 100]);
  });

  it('should preserve min > max after clamping (returns empty results naturally)', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        filter: { dataQuality: [80, 20] },
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter.dataQuality).deepEqual([80, 20]);
  });

  it('should remove dataQuality filter when values are non-numeric', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        filter: { dataQuality: ['abc', 'xyz'] },
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter).not.have.property('dataQuality');
  });

  it('should preserve other filters when dataQuality is removed due to non-numeric values', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({
        query: 'test',
        entity: 'entrances',
        filter: { dataQuality: ['invalid', 50], country: 'FR' },
      })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter).not.have.property('dataQuality');
    should(callArgs.filter).have.property('country', 'FR');
  });

  it('should pass filter through unchanged when no dataQuality key exists', async () => {
    const stub = stubCollectionSearch();

    await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'entrances', filter: { country: 'FR' } })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(stub.calledOnce).be.true();
    const callArgs = stub.firstCall.args[0];
    should(callArgs.filter).deepEqual({ country: 'FR' });
  });
});
