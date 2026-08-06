/* eslint-disable global-require */
const supertest = require('supertest');
const sinon = require('sinon');
const should = require('should');

/**
 * Integration tests — authorsOrganization field is preserved in advanced-search
 * results for documents.
 *
 * Validates Requirements 2.1, 2.2, 6.4 — Design Property 2.
 *
 * These are conventional it() tests with supertest. HTTP round-trips must NOT
 * run inside fc.assert loops (causes socket hang-ups under load).
 */
describe('Advanced search — document authorsOrganization field in results', () => {
  let SearchService;

  before(() => {
    SearchService = require('../../../../api/services/SearchService');
  });

  afterEach(() => {
    sinon.restore();
  });

  /**
   * Case 1 — field present:
   * When the Typesense hit contains authorsOrganization, the converter (toDocument
   * via toSearchResult) must retain it in the response payload.
   *
   * Validates: Requirements 2.1, 6.4
   */
  it('returns authorsOrganization in results when the field is present in the Typesense hit', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [
        {
          document: {
            id: '1',
            creatorId: 1,
            creator: 'TestAuthor',
            type: 'Article',
            dateInscription: 1700000000000,
            authorsOrganization: [
              { name: 'Société méridionale de spéléologie' },
            ],
          },
          highlight: {},
        },
      ],
      found: 1,
      out_of: 1,
      page: 1,
      request_params: { collection_name: 'documents_1' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'documents' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
    should(res.body.results).be.an.Array().with.lengthOf(1);
    should(res.body.results[0]).have.property('authorsOrganization');
    should(res.body.results[0].authorsOrganization)
      .be.an.Array()
      .with.lengthOf(1);
    should(res.body.results[0].authorsOrganization[0]).have.property(
      'name',
      'Société méridionale de spéléologie'
    );
  });

  /**
   * Case 2 — field absent:
   * When the Typesense hit does not contain authorsOrganization, toList returns []
   * (no default injection of non-empty values). The response must not contain a
   * non-empty authorsOrganization array.
   *
   * Note: toDocument always emits authorsOrganization via toList, which returns []
   * when the source field is absent. An empty array is acceptable — it confirms no
   * default content was injected.
   *
   * Validates: Requirements 2.2
   */
  it('returns an empty authorsOrganization array when the field is absent from the Typesense hit', async () => {
    sinon.stub(SearchService, 'collectionSearch').resolves({
      hits: [
        {
          document: {
            id: '2',
            creatorId: 1,
            creator: 'TestAuthor',
            type: 'Article',
            dateInscription: 1700000000000,
            // authorsOrganization intentionally omitted
          },
          highlight: {},
        },
      ],
      found: 1,
      out_of: 1,
      page: 1,
      request_params: { collection_name: 'documents_1' },
    });

    const res = await supertest(sails.hooks.http.app)
      .post('/api/v1/advanced-search')
      .send({ query: 'test', entity: 'documents' })
      .set('Content-type', 'application/json')
      .set('Accept', 'application/json');

    should(res.status).equal(200);
    should(res.body.results).be.an.Array().with.lengthOf(1);
    // toList returns [] when the source field is absent — no content is injected
    should(res.body.results[0].authorsOrganization).eql([]);
  });
});
