const should = require('should');
const sinon = require('sinon');
const SearchService = require('../../../api/services/SearchService');
const typesense = require('../../../config/typesense');

describe('SearchService', () => {
  let typesenseStub;

  beforeEach(() => {
    typesenseStub = {};
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('isAlive()', () => {
    it('should return true when typesense is alive', async () => {
      sinon.stub(typesense, 'isAlive').resolves(true);
      const result = await SearchService.isAlive();
      should(result).be.true();
    });

    it('should return false when typesense is not alive', async () => {
      sinon.stub(typesense, 'isAlive').resolves(false);
      const result = await SearchService.isAlive();
      should(result).be.false();
    });
  });

  describe('deleteDocument()', () => {
    it('should delete document for valid entity', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      typesenseStub.deleteDocument = sinon
        .stub(typesense, 'deleteDocument')
        .resolves();

      await SearchService.deleteDocument('organizations', '123');

      should(typesenseStub.deleteDocument.calledOnce).be.true();
      should(
        typesenseStub.deleteDocument.calledWith('organizations', '123')
      ).be.true();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not delete document for invalid entity', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      typesenseStub.deleteDocument = sinon
        .stub(typesense, 'deleteDocument')
        .resolves();

      await SearchService.deleteDocument('invalid_entity', '123');

      should(typesenseStub.deleteDocument.called).be.false();
      process.env.NODE_ENV = originalEnv;
    });

    it('should skip deletion in test environment', async () => {
      typesenseStub.deleteDocument = sinon
        .stub(typesense, 'deleteDocument')
        .resolves();

      await SearchService.deleteDocument('organizations', '123');

      should(typesenseStub.deleteDocument.called).be.false();
    });
  });

  describe('updateDocument()', () => {
    it('should update document for valid entity', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      typesenseStub.importDocuments = sinon
        .stub(typesense, 'importDocuments')
        .resolves();

      const doc = { id: '123', name: 'Test' };
      await SearchService.updateDocument('organizations', doc);

      should(typesenseStub.importDocuments.calledOnce).be.true();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not update document for invalid entity', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      typesenseStub.importDocuments = sinon
        .stub(typesense, 'importDocuments')
        .resolves();

      await SearchService.updateDocument('invalid_entity', { id: '123' });

      should(typesenseStub.importDocuments.called).be.false();
      process.env.NODE_ENV = originalEnv;
    });

    it('should skip update in test environment', async () => {
      typesenseStub.importDocuments = sinon
        .stub(typesense, 'importDocuments')
        .resolves();

      await SearchService.updateDocument('organizations', { id: '123' });

      should(typesenseStub.importDocuments.called).be.false();
    });

    it('should handle import errors gracefully', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      typesenseStub.importDocuments = sinon
        .stub(typesense, 'importDocuments')
        .rejects(new Error('Import failed'));

      await SearchService.updateDocument('organizations', { id: '123' });

      should(typesenseStub.importDocuments.calledOnce).be.true();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('multiCollectionsSearch()', () => {
    it('should search across multiple collections', async () => {
      typesenseStub.multiSearch = sinon
        .stub(typesense, 'multiSearch')
        .resolves({ results: [] });

      const result = await SearchService.multiCollectionsSearch({
        query: 'test',
        entities: ['organizations', 'persons'],
      });

      should(typesenseStub.multiSearch.calledOnce).be.true();
      should(result).have.property('results');
    });

    it('should handle call with no arguments', async () => {
      const result = await SearchService.multiCollectionsSearch();
      should(result).be.null();
    });

    it('should return null for empty entities array', async () => {
      const result = await SearchService.multiCollectionsSearch({
        query: 'test',
        entities: [],
      });

      should(result).be.null();
    });

    it('should filter out invalid entities', async () => {
      typesenseStub.multiSearch = sinon
        .stub(typesense, 'multiSearch')
        .resolves({ results: [] });

      await SearchService.multiCollectionsSearch({
        query: 'test',
        entities: ['organizations', 'invalid_entity'],
      });

      const call = typesenseStub.multiSearch.getCall(0);
      should(call.args[0].length).equal(1);
    });

    it('should use wildcard query when no query provided', async () => {
      typesenseStub.multiSearch = sinon
        .stub(typesense, 'multiSearch')
        .resolves({ results: [] });

      await SearchService.multiCollectionsSearch({
        entities: ['organizations'],
      });

      const call = typesenseStub.multiSearch.getCall(0);
      should(call.args[1].q).equal('*');
    });

    it('should apply filters correctly', async () => {
      typesenseStub.multiSearch = sinon
        .stub(typesense, 'multiSearch')
        .resolves({ results: [] });

      await SearchService.multiCollectionsSearch({
        query: 'test',
        entities: ['organizations'],
        filter: { country: 'FR' },
      });

      const call = typesenseStub.multiSearch.getCall(0);
      should(call.args[0][0]).have.property('filter_by');
    });
  });

  describe('collectionSearch()', () => {
    it('should search in a single collection', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      const result = await SearchService.collectionSearch({
        query: 'test',
        entity: 'organizations',
      });

      should(typesenseStub.search.calledOnce).be.true();
      should(result).have.property('hits');
    });

    it('should handle call with no arguments', async () => {
      const result = await SearchService.collectionSearch();
      should(result).be.null();
    });

    it('should return null for invalid entity', async () => {
      const result = await SearchService.collectionSearch({
        query: 'test',
        entity: 'invalid_entity',
      });

      should(result).be.null();
    });

    it('should apply sort parameter', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        query: 'test',
        entity: 'organizations',
        sort: 'name:asc',
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1]).have.property('sort_by');
      should(call.args[1].sort_by).equal('name:asc,_text_match:desc');
    });

    it('should apply filter with AND logic', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        query: 'test',
        entity: 'organizations',
        filter: { country: 'FR', active: true },
        isLogicalCompareAnd: true,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).match(/&&/);
    });

    it('should apply filter with OR logic', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        query: 'test',
        entity: 'organizations',
        filter: { country: 'FR', active: true },
        isLogicalCompareAnd: false,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).match(/\|\|/);
    });

    it('should apply pagination parameters', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        query: 'test',
        entity: 'organizations',
        page: 2,
        size: 50,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].page).equal(2);
      should(call.args[1].per_page).equal(50);
    });

    it('should apply fields parameter', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        query: 'test',
        entity: 'organizations',
        fields: ['id', 'name'],
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].include_fields).equal('id,name');
    });

    it('should cap size parameter at 1000 to prevent Typesense errors', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        query: 'test',
        entity: 'organizations',
        size: 2000,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].per_page).equal(1000);
    });

    it('should not modify size parameter when under 1000', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        query: 'test',
        entity: 'organizations',
        size: 500,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].per_page).equal(500);
    });
  });

  describe('fieldSearch()', () => {
    it('should search by specific field', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ grouped_hits: [] });

      const result = await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'test',
      });

      should(typesenseStub.search.calledOnce).be.true();
      should(result).have.property('grouped_hits');
    });

    it('should handle call with no arguments', async () => {
      const result = await SearchService.fieldSearch();
      should(result).be.null();
    });

    it('should use wildcard when no query provided', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ grouped_hits: [] });

      await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].q).equal('*');
    });

    it('should return null for invalid entity', async () => {
      const result = await SearchService.fieldSearch({
        entity: 'invalid_entity',
        field: 'name',
        query: 'test',
      });

      should(result).be.null();
    });

    it('should return null when field is not provided', async () => {
      const result = await SearchService.fieldSearch({
        entity: 'organizations',
        query: 'test',
      });

      should(result).be.null();
    });

    it('should apply filter with AND logic', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ grouped_hits: [] });

      await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'test',
        filter: { country: 'FR', active: true },
        isLogicalCompareAnd: true,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).match(/&&/);
    });

    it('should apply filter with OR logic', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ grouped_hits: [] });

      await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'test',
        filter: { country: 'FR', active: true },
        isLogicalCompareAnd: false,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).match(/\|\|/);
    });

    it('should apply size parameter', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ grouped_hits: [] });

      await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'test',
        size: 100,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].per_page).equal(100);
    });
  });

  describe('buildFilter()', () => {
    it('should handle string values with backticks', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'organizations',
        filter: { country: 'FR' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('country:`FR`');
    });

    it('should handle boolean values with exact match', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'organizations',
        filter: { active: true },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('active:=true');
    });

    it('should handle number values with exact match', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'organizations',
        filter: { count: 5 },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('count:=5');
    });

    it('should handle array values as range', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'organizations',
        filter: { year: [2020, 2024] },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('year:[2020..2024]');
    });

    it('should filter out all falsy values including zero', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'organizations',
        filter: { country: 'FR', empty: null, zero: 0 },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('country:`FR`');
    });

    it('should filter out null and undefined', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'organizations',
        filter: { country: 'FR', empty: null, undef: undefined },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('country:`FR`');
    });

    it('should use prefix filter for datePublication with year only', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'documents',
        filter: { datePublication: '2025' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('datePublication:=2025*');
    });

    it('should use prefix filter for datePublication with year-month', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'documents',
        filter: { datePublication: '2025-01' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('datePublication:=2025-01*');
    });

    it('should use prefix filter for datePublication with full date', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'documents',
        filter: { datePublication: '2025-01-15' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('datePublication:=2025-01-15*');
    });

    it('should set max_filter_by_candidates when datePublication prefix filter is used', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'documents',
        filter: { datePublication: '2025' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].max_filter_by_candidates).equal(100);
    });

    it('should not set max_filter_by_candidates when no prefix filter is used', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'organizations',
        filter: { country: 'FR' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].max_filter_by_candidates).be.undefined();
    });

    it('should set max_filter_by_candidates in multiCollectionsSearch with prefix filter', async () => {
      typesenseStub.multiSearch = sinon
        .stub(typesense, 'multiSearch')
        .resolves({ results: [] });

      await SearchService.multiCollectionsSearch({
        query: 'test',
        entities: ['documents'],
        filter: { datePublication: '2025' },
      });

      const call = typesenseStub.multiSearch.getCall(0);
      should(call.args[1].max_filter_by_candidates).equal(100);
    });
  });
});
