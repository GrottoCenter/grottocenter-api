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

  describe('syncDocuments()', () => {
    beforeEach(() => {
      typesenseStub.importDocuments = sinon
        .stub(typesense, 'importDocuments')
        .resolves();
      typesenseStub.deleteDocuments = sinon
        .stub(typesense, 'deleteDocuments')
        .resolves();
    });

    it('should upsert the built documents with the collection formater', async () => {
      await SearchService.syncDocuments('organizations', [2, '1']);

      should(typesenseStub.importDocuments.calledOnce).be.true();
      const [collectionName, documents, formater] =
        typesenseStub.importDocuments.getCall(0).args;
      should(collectionName).equal('organizations');
      should(documents.map((d) => d.id)).eql([1, 2]);
      should(formater).equal(
        SearchService.allEntities.organizations.importFormater
      );
      should(typesenseStub.deleteDocuments.called).be.false();
    });

    it('should delete the ids that are no longer indexed, in one batch', async () => {
      await SearchService.syncDocuments('organizations', [1, 424242, 424243]);

      should(typesenseStub.importDocuments.calledOnce).be.true();
      should(typesenseStub.deleteDocuments.args).eql([
        ['organizations', [424242, 424243]],
      ]);
    });

    it('should not import when no document is built', async () => {
      // Device 2 is soft-deleted
      await SearchService.syncDocuments('devices', [2]);

      should(typesenseStub.importDocuments.called).be.false();
      should(typesenseStub.deleteDocuments.args).eql([['devices', [2]]]);
    });

    it('should not sync an invalid collection', async () => {
      await SearchService.syncDocuments('invalid_entity', [1]);

      should(typesenseStub.importDocuments.called).be.false();
      should(typesenseStub.deleteDocuments.called).be.false();
    });

    it('should throw when the import fails, so the caller can retry', async () => {
      typesenseStub.importDocuments.rejects(new Error('Import failed'));

      await SearchService.syncDocuments(
        'organizations',
        [1]
      ).should.be.rejectedWith('Import failed');
    });

    it('should throw when a removal fails', async () => {
      typesenseStub.deleteDocuments.rejects(new Error('Delete failed'));

      await SearchService.syncDocuments('devices', [2]).should.be.rejectedWith(
        'Delete failed'
      );
    });

    // Organization 1 is indexed, 424242 is not: an import, then a removal
    describe('when told to stop', () => {
      const stopped = { code: 'E_SEARCH_SYNC_STOPPED' };

      it('should neither import nor remove when stopped from the start', async () => {
        await SearchService.syncDocuments('organizations', [1, 424242], {
          shouldStop: () => true,
        }).should.be.rejectedWith(stopped);

        should(typesenseStub.importDocuments.called).be.false();
        should(typesenseStub.deleteDocuments.called).be.false();
      });

      it('should not start the removals once stopped during the import', async () => {
        let stop = false;
        typesenseStub.importDocuments.callsFake(async () => {
          stop = true;
        });

        await SearchService.syncDocuments('organizations', [1, 424242], {
          shouldStop: () => stop,
        }).should.be.rejectedWith(stopped);

        should(typesenseStub.importDocuments.calledOnce).be.true();
        should(typesenseStub.deleteDocuments.called).be.false();
      });
    });
  });

  describe('multiCollectionsSearch()', () => {
    it('should search across multiple collections', async () => {
      typesenseStub.multiSearch = sinon
        .stub(typesense, 'multiSearch')
        .resolves({ hits: [] });

      const result = await SearchService.multiCollectionsSearch({
        query: 'test',
        entities: ['organizations', 'persons'],
      });

      should(typesenseStub.multiSearch.calledOnce).be.true();
      should(result).have.property('hits');
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
        .resolves({ hits: [] });

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
        .resolves({ hits: [] });

      await SearchService.multiCollectionsSearch({
        entities: ['organizations'],
      });

      const call = typesenseStub.multiSearch.getCall(0);
      should(call.args[1].q).equal('*');
    });

    it('should apply filters correctly', async () => {
      typesenseStub.multiSearch = sinon
        .stub(typesense, 'multiSearch')
        .resolves({ hits: [] });

      await SearchService.multiCollectionsSearch({
        query: 'test',
        entities: ['organizations'],
        filter: { country: 'FR' },
      });

      const call = typesenseStub.multiSearch.getCall(0);
      should(call.args[0][0]).have.property('filter_by');
    });

    it('should raise max_candidates above the Typesense default', async () => {
      typesenseStub.multiSearch = sinon
        .stub(typesense, 'multiSearch')
        .resolves({ hits: [] });

      await SearchService.multiCollectionsSearch({
        query: 'GZ3',
        entities: ['entrances'],
      });

      const call = typesenseStub.multiSearch.getCall(0);
      should(call.args[1].max_candidates).equal(1000);
    });

    describe('when a union search fails inside a 200 response (#2001)', () => {
      it('should throw the Typesense error with its code as httpStatus', async () => {
        sinon.stub(typesense, 'multiSearch').resolves({
          code: 404,
          error: '`documents` collection not found.',
        });
        const logStub = sinon.stub(sails.log, 'error');

        const error = await SearchService.multiCollectionsSearch({
          query: 'No 15 1984*PERDU*',
          entities: ['documents'],
        }).then(
          () => null,
          (e) => e
        );

        should(error).be.an.Error();
        should(error.message).equal('`documents` collection not found.');
        should(error.httpStatus).equal(404);
        should(logStub.calledOnce).be.true();
        should(logStub.firstCall.args[0]).containEql(
          '"error":"`documents` collection not found."'
        );
      });

      it('should throw a server error for a body of unknown shape', async () => {
        sinon.stub(typesense, 'multiSearch').resolves({ results: [] });
        const logStub = sinon.stub(sails.log, 'error');

        const error = await SearchService.multiCollectionsSearch({
          query: 'test',
          entities: ['documents'],
        }).then(
          () => null,
          (e) => e
        );

        should(error).be.an.Error();
        should(error).not.have.property('httpStatus');
        should(logStub.firstCall.args[0]).containEql('{"results":[]}');
      });
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

    it('should filter and sort documents on hasFiles with bare booleans', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'documents',
        sort: 'hasFiles:desc',
        filter: { hasFiles: false, type: 'Article' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal(
        '(hasFiles:=false && type:`Article`) && validationStatus:!=pending'
      );
      should(call.args[1].sort_by).equal('hasFiles:desc,_text_match:desc');
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

    it('should raise max_candidates above the Typesense default', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        query: 'GZ3',
        entity: 'entrances',
        size: 200,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].max_candidates).equal(1000);
    });
  });

  describe('fieldSearch()', () => {
    const facetResponse = (counts = [], stats = {}) => ({
      facet_counts: [{ field_name: 'name', counts, stats }],
      page: 1,
    });

    it('should search by specific field using facet search', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves(
          facetResponse([{ value: 'Org A', count: 3 }], { total_values: 1 })
        );

      const result = await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'test',
      });

      should(typesenseStub.search.calledOnce).be.true();
      should(result).have.property('grouped_hits');
      should(result.found).equal(1);
      should(result.found_docs).equal(3);
      should(result.grouped_hits[0].group_key).deepEqual(['Org A']);
      should(result.grouped_hits[0].found).equal(3);
    });

    it('should handle call with no arguments', async () => {
      const result = await SearchService.fieldSearch();
      should(result).be.null();
    });

    it('should use wildcard and no facet_query when no query provided', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves(facetResponse());

      await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].q).equal('*');
      should(call.args[1].facet_query).be.undefined();
    });

    it('should set facet_query when query is provided', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves(facetResponse());

      await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'test',
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].facet_query).equal('name:test');
    });

    it('should use facet_by and per_page 0', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves(facetResponse());

      await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'test',
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].facet_by).equal('name');
      should(call.args[1].per_page).equal(0);
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
        .resolves(facetResponse());

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
        .resolves(facetResponse());

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

    it('should apply size as max_facet_values capped at 100', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves(facetResponse());

      await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'test',
        size: 50,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].max_facet_values).equal(50);
    });

    it('should cap max_facet_values at 100 for large size values', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves(facetResponse());

      await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'test',
        size: 500,
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].max_facet_values).equal(100);
    });

    it('should return empty grouped_hits when no facet counts', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ facet_counts: [], page: 1 });

      const result = await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'nonexistent',
      });

      should(result.found).equal(0);
      should(result.found_docs).equal(0);
      should(result.grouped_hits).deepEqual([]);
    });

    it('should use stats.total_values for found when more distinct values exist than returned', async () => {
      typesenseStub.search = sinon.stub(typesense, 'search').resolves(
        facetResponse(
          [
            { value: 'Org A', count: 3 },
            { value: 'Org B', count: 2 },
          ],
          { total_values: 50 }
        )
      );

      const result = await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'org',
        size: 2,
      });

      // found reflects the true total, not just the returned count
      should(result.found).equal(50);
      should(result.found_docs).equal(5);
      should(result.grouped_hits.length).equal(2);
    });

    it('should fall back to counts.length when stats.total_values is not available', async () => {
      typesenseStub.search = sinon.stub(typesense, 'search').resolves(
        facetResponse([
          { value: 'Org A', count: 3 },
          { value: 'Org B', count: 2 },
        ])
      );

      const result = await SearchService.fieldSearch({
        entity: 'organizations',
        field: 'name',
        query: 'org',
      });

      should(result.found).equal(2);
      should(result.found_docs).equal(5);
    });

    it('should raise max_candidates above the Typesense default', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves(facetResponse());

      await SearchService.fieldSearch({
        entity: 'entrances',
        field: 'name',
        query: 'GZ3',
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].max_candidates).equal(1000);
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

    it('should handle two-number array values as numeric range', async () => {
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

    it('should handle string array values as multi-value exact match', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { 'massifs.name': ['Vercors (massif du)'] },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal(
        'massifs.name:=[`Vercors (massif du)`]'
      );
    });

    it('should skip empty arrays and produce no filter', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { 'massifs.name': [] },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).be.undefined();
    });

    it('should handle single-element numeric array as multi-value exact match', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { depth: [5] },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('depth:=[`5`]');
    });

    it('should strip backtick characters from string values to prevent malformed filters', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { city: 'foo`bar' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('city:`foobar`');
    });

    it('should strip backtick characters from array element values', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { 'massifs.name': ['foo`bar', 'baz`qux'] },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('massifs.name:=[`foobar`,`bazqux`]');
    });

    it('should handle multiple string array values as multi-value exact match', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { 'massifs.name': ['Vercors (massif du)', 'Chartreuse'] },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal(
        'massifs.name:=[`Vercors (massif du)`,`Chartreuse`]'
      );
    });

    it('should filter out null but keep false and zero as valid filter values', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'organizations',
        filter: { country: 'FR', empty: null, zero: 0 },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('country:`FR` && zero:=0');
    });

    it('should keep false as a valid filter value', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { isPublic: false },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('isPublic:=false');
    });

    it('should keep zero as a valid filter value', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { altitude: 0 },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('altitude:=0');
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
      should(call.args[1].filter_by).equal(
        '(datePublication:=2025*) && validationStatus:!=pending'
      );
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
      should(call.args[1].filter_by).equal(
        '(datePublication:=2025-01*) && validationStatus:!=pending'
      );
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
      should(call.args[1].filter_by).equal(
        '(datePublication:=2025-01-15*) && validationStatus:!=pending'
      );
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
        .resolves({ hits: [] });

      await SearchService.multiCollectionsSearch({
        query: 'test',
        entities: ['documents'],
        filter: { datePublication: '2025' },
      });

      const call = typesenseStub.multiSearch.getCall(0);
      should(call.args[1].max_filter_by_candidates).equal(100);
    });

    it('should filter out empty strings', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { city: '', country: 'FR' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('country:`FR`');
    });

    it('should filter out whitespace-only strings', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { city: '   ', country: 'FR' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('country:`FR`');
    });

    it('should trim trailing whitespace from non-empty string values before filtering', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { city: '. ', county: '', country: '', region: '' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('city:`.`');
    });

    it('should trim leading and trailing whitespace from string filter values', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { country: '  FR  ' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).equal('country:`FR`');
    });

    it('should produce no filter_by when all filter values are empty or whitespace', async () => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [] });

      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { city: '', county: '', country: '', region: '   ' },
      });

      const call = typesenseStub.search.getCall(0);
      should(call.args[1].filter_by).be.undefined();
    });
  });

  // Pending submissions are searchable on request only (#1561)
  describe('document validation scope', () => {
    const SCOPE = 'validationStatus:!=pending';

    beforeEach(() => {
      typesenseStub.search = sinon
        .stub(typesense, 'search')
        .resolves({ hits: [], facet_counts: [], page: 1 });
      typesenseStub.multiSearch = sinon
        .stub(typesense, 'multiSearch')
        .resolves({ hits: [] });
    });

    const searchParams = () => typesenseStub.search.getCall(0).args[1];

    it('leaves the pending documents out by default', async () => {
      await SearchService.collectionSearch({ entity: 'documents' });
      should(searchParams().filter_by).equal(SCOPE);
    });

    it('includes the pending documents on request', async () => {
      await SearchService.collectionSearch({
        entity: 'documents',
        includePendingDocuments: true,
      });
      should(searchParams().filter_by).be.undefined();
    });

    it('keeps the business filter unchanged on request', async () => {
      await SearchService.collectionSearch({
        entity: 'documents',
        filter: { type: 'Article', hasFiles: true },
        includePendingDocuments: true,
      });
      should(searchParams().filter_by).equal(
        'type:`Article` && hasFiles:=true'
      );
    });

    it('cannot be widened by matching any filter', async () => {
      await SearchService.collectionSearch({
        entity: 'documents',
        filter: { type: 'Article', hasFiles: true },
        isLogicalCompareAnd: false,
      });
      should(searchParams().filter_by).equal(
        `(type:\`Article\` || hasFiles:=true) && ${SCOPE}`
      );
    });

    it('does not scope the other entities', async () => {
      await SearchService.collectionSearch({
        entity: 'entrances',
        filter: { country: 'FR' },
      });
      should(searchParams().filter_by).equal('country:`FR`');
    });

    it('scopes the field suggestions', async () => {
      await SearchService.fieldSearch({
        entity: 'documents',
        field: 'type',
        filter: { language: 'fra' },
        isLogicalCompareAnd: false,
      });
      should(searchParams().filter_by).equal(`(language:\`fra\`) && ${SCOPE}`);
    });

    it('includes the pending documents in the field suggestions on request', async () => {
      await SearchService.fieldSearch({
        entity: 'documents',
        field: 'type',
        includePendingDocuments: true,
      });
      should(searchParams().filter_by).be.undefined();
    });

    it('only scopes the documents of a multi-collection search', async () => {
      await SearchService.multiCollectionsSearch({
        query: 'karst',
        entities: ['entrances', 'documents'],
      });
      const [collections] = typesenseStub.multiSearch.getCall(0).args;
      should(collections.map((c) => [c.collection, c.filter_by])).eql([
        ['entrances', undefined],
        ['documents', SCOPE],
      ]);
    });

    it('includes the pending documents of a multi-collection search on request', async () => {
      await SearchService.multiCollectionsSearch({
        query: 'karst',
        entities: ['entrances', 'documents'],
        filter: { name: 'x' },
        includePendingDocuments: true,
      });
      const [collections] = typesenseStub.multiSearch.getCall(0).args;
      should(collections.map((c) => c.filter_by)).eql(['name:`x`', 'name:`x`']);
    });
  });
});
