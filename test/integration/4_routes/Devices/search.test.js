/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

describe('Device features', () => {
  describe('search', () => {
    let SearchService;

    before(() => {
      SearchService = require('../../../../api/services/SearchService');
    });

    afterEach(() => {
      sinon.restore();
    });

    describe('Public access', () => {
      it('should not require authentication', async () => {
        sinon.stub(SearchService, 'collectionSearch').resolves({
          hits: [],
          found: 0,
          out_of: 0,
          page: 1,
          request_params: { collection_name: 'devices' },
        });

        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/devices/search')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);

        should(res.body).have.property('totalResults', 0);
      });
    });

    describe('Query passthrough', () => {
      it('should pass query parameter to SearchService', async () => {
        const stub = sinon.stub(SearchService, 'collectionSearch').resolves({
          hits: [],
          found: 0,
          out_of: 0,
          page: 1,
          request_params: { collection_name: 'devices' },
        });

        await supertest(sails.hooks.http.app)
          .get('/api/v1/devices/search?query=logger')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);

        should(stub.calledOnce).be.true();
        should(stub.firstCall.args[0].query).equal('logger');
        should(stub.firstCall.args[0].entity).equal('devices');
      });
    });

    describe('Pagination defaults', () => {
      it('should default to page 1 and size 10', async () => {
        const stub = sinon.stub(SearchService, 'collectionSearch').resolves({
          hits: [],
          found: 0,
          out_of: 0,
          page: 1,
          request_params: { collection_name: 'devices' },
        });

        await supertest(sails.hooks.http.app)
          .get('/api/v1/devices/search')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);

        should(stub.calledOnce).be.true();
        should(stub.firstCall.args[0].page).equal(1);
        should(stub.firstCall.args[0].size).equal(10);
      });

      it('should pass custom page and size', async () => {
        const stub = sinon.stub(SearchService, 'collectionSearch').resolves({
          hits: [],
          found: 0,
          out_of: 0,
          page: 2,
          request_params: { collection_name: 'devices' },
        });

        await supertest(sails.hooks.http.app)
          .get('/api/v1/devices/search?page=2&size=5')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);

        should(stub.calledOnce).be.true();
        should(stub.firstCall.args[0].page).equal('2');
        should(stub.firstCall.args[0].size).equal('5');
      });
    });

    describe('Sort', () => {
      it('should pass sort parameter to SearchService', async () => {
        const stub = sinon.stub(SearchService, 'collectionSearch').resolves({
          hits: [],
          found: 0,
          out_of: 0,
          page: 1,
          request_params: { collection_name: 'devices' },
        });

        await supertest(sails.hooks.http.app)
          .get('/api/v1/devices/search?sort=name:asc')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);

        should(stub.calledOnce).be.true();
        should(stub.firstCall.args[0].sort).equal('name:asc');
      });
    });

    describe('Filter', () => {
      it('should pass filter parameter to SearchService', async () => {
        const stub = sinon.stub(SearchService, 'collectionSearch').resolves({
          hits: [],
          found: 0,
          out_of: 0,
          page: 1,
          request_params: { collection_name: 'devices' },
        });

        await supertest(sails.hooks.http.app)
          .get('/api/v1/devices/search?filter[isDeleted]=false')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json')
          .expect(200);

        should(stub.calledOnce).be.true();
        should(stub.firstCall.args[0].filter).deepEqual({
          isDeleted: 'false',
        });
      });
    });

    describe('Typesense error handling', () => {
      it('should return 400 for Typesense 4xx client error', async () => {
        const error = new Error('Typesense 422');
        error.httpStatus = 422;
        sinon.stub(SearchService, 'collectionSearch').rejects(error);

        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/devices/search?query=test')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        should(res.status).equal(400);
        should(res.body).have.property('error', 'Typesense 422');
      });

      it('should return 500 for Typesense 401 (server config issue)', async () => {
        const error = new Error('Unauthorized');
        error.httpStatus = 401;
        sinon.stub(SearchService, 'collectionSearch').rejects(error);

        const res = await supertest(sails.hooks.http.app)
          .get('/api/v1/devices/search?query=test')
          .set('Content-type', 'application/json')
          .set('Accept', 'application/json');

        should(res.status).equal(500);
      });
    });
  });
});
