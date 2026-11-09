/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

const search = (body) =>
  supertest(sails.hooks.http.app)
    .post('/api/v1/advanced-search')
    .send({ query: 'test', ...body })
    .set('Content-type', 'application/json')
    .set('Accept', 'application/json');

describe('Advanced Search - entrancesSort sort validation', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  ['entrancesSort:asc', 'entrancesSort:desc'].forEach((sort) => {
    it(`passes ${sort} through to the documents search`, async () => {
      const stub = sinon.stub(SearchService, 'collectionSearch').resolves({
        hits: [
          { document: { id: '1', title: 'Doc A', entrancesSort: '0aven' } },
        ],
        found: 1,
        out_of: 100,
        page: 1,
        request_params: { collection_name: 'documents' },
      });

      const res = await search({ entity: 'documents', sort });

      should(res.status).equal(200);
      should(stub.callCount).equal(1);
      should(stub.firstCall.args[0].entity).equal('documents');
      should(stub.firstCall.args[0].sort).equal(sort);
    });
  });

  it('allows entrancesSort in a multi-field sort on documents', async () => {
    const stub = sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [],
      found: 0,
      out_of: 100,
      page: 1,
      request_params: { collection_name: 'documents' },
    });

    const res = await search({
      entity: 'documents',
      sort: '_text_match:desc,entrancesSort:asc',
    });

    should(res.status).equal(200);
    should(stub.callCount).equal(1);
  });

  ['entrances', 'caves', 'massifs', 'persons'].forEach((entity) => {
    it(`returns 400 for entrancesSort on entity=${entity}`, async () => {
      const stub = sinon.stub(SearchService, 'collectionSearch');

      const res = await search({ entity, sort: 'entrancesSort:asc' });

      should(res.status).equal(400);
      should(stub.callCount).equal(0);
    });
  });

  it('returns 400 when entrancesSort appears in a multi-field sort on another entity', async () => {
    const res = await search({
      entity: 'caves',
      sort: '_text_match:desc,entrancesSort:desc',
    });

    should(res.status).equal(400);
  });
});
