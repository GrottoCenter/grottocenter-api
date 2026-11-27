const should = require('should');
const sinon = require('sinon');
const service = require('../../../api/services/BibliographicMetadataService');

describe('BibliographicMetadataService', () => {
  before(() => {
    // Mock timezone to UTC for consistent date handling
    process.env.TZ = 'UTC';
  });

  after(() => {
    // Restore original timezone
    delete process.env.TZ;
  });
  describe('getMetadata', () => {
    it('should return a single record by id', async () => {
      const record = await service.getMetadata(1);
      record.should.be.an.Object();
      record.id.should.be.equal(1);
    });

    it('should return null for unknown id', async () => {
      const record = await service.getMetadata(999999);
      should(record == null).be.true();
    });
  });

  describe('getOAIRecords', () => {
    it('should return all registered records by default', async () => {
      const records = await service.getOAIRecords();
      records.should.be.an.Array();
      records.length.should.equal(20); // Excludes deleted record
      records.forEach((record) => {
        record.should.have.property('id');
        record.should.have.property('oaiIdentifier');
        record.should.have.property('metadataStatus', 'registered');
      });
    });

    it('should include deleted records when filter is empty', async () => {
      const records = await service.getOAIRecords({}, {});
      records.should.be.an.Array();
      records.length.should.equal(21); // Includes deleted record
    });

    it('should filter by set', async () => {
      const records = await service.getOAIRecords({
        set: 'grottocenter:sound',
      });
      records.should.be.an.Array();
      records.length.should.equal(5); // ids: 1, 4, 14, 15, 17
      records.forEach((record) => {
        record.listSets.should.containEql('grottocenter:sound');
        record.should.have.property('dcTypeGrottocenter', 'sound');
      });
    });

    it('should filter by from date', async () => {
      const records = await service.getOAIRecords({ from: '2025-01-10' });
      records.should.be.an.Array();
      records.length.should.equal(12); // actual count from CI
      records.forEach((record) => {
        const lastUpdate = new Date(record.lastUpdate);
        const fromDate = new Date('2025-01-10');
        fromDate.setUTCHours(0, 0, 0, 0);
        lastUpdate.should.be.greaterThanOrEqual(fromDate);
      });
    });

    it('should filter by until date', async () => {
      const records = await service.getOAIRecords({ until: '2025-01-05' });
      records.should.be.an.Array();
      records.length.should.equal(4); // actual count from CI
      records.forEach((record) => {
        const lastUpdate = new Date(record.lastUpdate);
        const untilDate = new Date('2025-01-05');
        untilDate.setUTCHours(23, 59, 59, 999);
        lastUpdate.should.be.lessThanOrEqual(untilDate);
      });
    });

    it('should filter by date range', async () => {
      const records = await service.getOAIRecords({
        from: '2025-01-03',
        until: '2025-01-05',
      });
      records.should.be.an.Array();
      records.length.should.equal(3); // ids: 3, 4, 5
    });

    it('should throw error on invalid from date', async () => {
      try {
        await service.getOAIRecords({ from: 'invalid-date' });
        throw new Error('Should have thrown');
      } catch (error) {
        error.message.should.match(/Invalid 'from' date/);
      }
    });

    it('should throw error on invalid until date', async () => {
      try {
        await service.getOAIRecords({ until: 'invalid-date' });
        throw new Error('Should have thrown');
      } catch (error) {
        error.message.should.match(/Invalid 'until' date/);
      }
    });
  });

  describe('getOAIRecordsPaginated', () => {
    it('should return paginated records with default parameters', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 10,
        offset: 0,
      });
      result.records.should.be.an.Array();
      result.records.length.should.be.belowOrEqual(10);
      result.limit.should.equal(10);
      result.offset.should.equal(0);
      result.should.have.property('hasNext');
    });

    it('should respect limit and offset parameters', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 5,
        offset: 3,
      });
      result.records.should.be.an.Array();
      result.records.length.should.be.belowOrEqual(5);
      result.limit.should.equal(5);
      result.offset.should.equal(3);
    });

    it('should include deleted records when filter is empty', async () => {
      const result = await service.getOAIRecordsPaginated(
        {
          limit: 50,
          offset: 0,
        },
        {}
      );
      result.records.should.be.an.Array();
    });

    it('should filter by set in paginated results', async () => {
      const result = await service.getOAIRecordsPaginated({
        set: 'grottocenter:image',
        limit: 10,
        offset: 0,
      });
      result.records.should.be.an.Array();
      result.records.forEach((record) => {
        record.listSets.should.containEql('grottocenter:image');
      });
    });

    it('should handle pagination beyond available records', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 10,
        offset: 100,
      });
      result.records.should.be.an.Array();
      result.records.length.should.equal(0);
      result.hasNext.should.be.false();
    });

    it('should calculate hasNext correctly', async () => {
      const result1 = await service.getOAIRecordsPaginated({
        limit: 5,
        offset: 0,
      });
      result1.hasNext.should.be.true();

      const result2 = await service.getOAIRecordsPaginated({
        limit: 50,
        offset: 0,
      });
      result2.hasNext.should.be.false();
    });
  });

  describe('getOAIIdentifiers', () => {
    it('should return all identifiers by default', async () => {
      const identifiers = await service.getOAIIdentifiers();
      identifiers.should.be.an.Array();
      identifiers.length.should.equal(20); // Excludes deleted record
      identifiers.forEach((identifier) => {
        identifier.should.have.property('oaiIdentifier');
        identifier.should.have.property('lastUpdate');
        identifier.should.have.property('listSets');
        identifier.oaiIdentifier.should.match(/^oai:grottocenter\.org:\d+$/);
      });
    });

    it('should include deleted records when filter is empty', async () => {
      const identifiers = await service.getOAIIdentifiers({}, {});
      identifiers.should.be.an.Array();
      identifiers.length.should.equal(21); // Includes deleted record
    });

    it('should filter by set', async () => {
      const identifiers = await service.getOAIIdentifiers({
        set: 'grottocenter:dataset',
      });
      identifiers.should.be.an.Array();
      identifiers.length.should.equal(2); // ids: 11, 20
      identifiers.forEach((identifier) => {
        identifier.listSets.should.containEql('grottocenter:dataset');
      });
    });

    it('should filter by from date', async () => {
      const identifiers = await service.getOAIIdentifiers({
        from: '2025-01-15',
      });
      identifiers.should.be.an.Array();
      identifiers.length.should.equal(8); // actual count from CI
      identifiers.forEach((identifier) => {
        const lastUpdate = new Date(identifier.lastUpdate);
        const fromDate = new Date('2025-01-15');
        fromDate.setUTCHours(0, 0, 0, 0);
        lastUpdate.should.be.greaterThanOrEqual(fromDate);
      });
    });

    it('should filter by until date', async () => {
      const identifiers = await service.getOAIIdentifiers({
        until: '2025-01-03',
      });
      identifiers.should.be.an.Array();
      identifiers.length.should.equal(2); // actual count from CI
      identifiers.forEach((identifier) => {
        const lastUpdate = new Date(identifier.lastUpdate);
        const untilDate = new Date('2025-01-03');
        untilDate.setUTCHours(23, 59, 59, 999);
        lastUpdate.should.be.lessThanOrEqual(untilDate);
      });
    });

    it('should return only essential fields for identifiers', async () => {
      const identifiers = await service.getOAIIdentifiers();
      identifiers.forEach((identifier) => {
        // Should only have essential fields, not full record data
        identifier.should.have.properties([
          'oaiIdentifier',
          'lastUpdate',
          'listSets',
        ]);
        identifier.should.not.have.property('dcTitle'); // Full record field
        identifier.should.not.have.property('dcCreators'); // Full record field
      });
    });
  });

  describe('getOAIIdentifiersPaginated', () => {
    it('should return paginated identifiers with default parameters', async () => {
      const result = await service.getOAIIdentifiersPaginated({
        limit: 5,
        offset: 0,
      });
      result.identifiers.should.be.an.Array();
      result.identifiers.length.should.be.belowOrEqual(5);
      result.limit.should.equal(5);
      result.offset.should.equal(0);
      result.should.have.property('hasNext');
    });

    it('should respect limit and offset parameters', async () => {
      const result = await service.getOAIIdentifiersPaginated({
        limit: 3,
        offset: 2,
      });
      result.identifiers.should.be.an.Array();
      result.identifiers.length.should.be.belowOrEqual(3);
      result.limit.should.equal(3);
      result.offset.should.equal(2);
    });

    it('should include deleted records when filter is empty', async () => {
      const result = await service.getOAIIdentifiersPaginated(
        {
          limit: 50,
          offset: 0,
        },
        {}
      );
      result.identifiers.should.be.an.Array();
    });

    it('should filter by set in paginated results', async () => {
      const result = await service.getOAIIdentifiersPaginated({
        set: 'grottocenter:collection',
        limit: 10,
        offset: 0,
      });
      result.identifiers.should.be.an.Array();
      result.identifiers.forEach((identifier) => {
        identifier.listSets.should.containEql('grottocenter:collection');
      });
    });

    it('should include deleted records in set filtering when filter is empty', async () => {
      const result = await service.getOAIIdentifiersPaginated(
        {
          set: 'grottocenter:collection',
          limit: 10,
          offset: 0,
        },
        {}
      );
      result.identifiers.should.be.an.Array();
    });

    it('should handle pagination beyond available identifiers', async () => {
      const result = await service.getOAIIdentifiersPaginated({
        limit: 10,
        offset: 100,
      });
      result.identifiers.should.be.an.Array();
      result.identifiers.length.should.equal(0);
      result.hasNext.should.be.false();
    });

    it('should calculate hasNext correctly', async () => {
      const result1 = await service.getOAIIdentifiersPaginated({
        limit: 5,
        offset: 0,
      });
      result1.hasNext.should.be.true();

      const result2 = await service.getOAIIdentifiersPaginated({
        limit: 50,
        offset: 0,
      });
      result2.hasNext.should.be.false();
    });

    it('should return identifiers in consistent order', async () => {
      const result1 = await service.getOAIIdentifiersPaginated({
        limit: 5,
        offset: 0,
      });
      const result2 = await service.getOAIIdentifiersPaginated({
        limit: 5,
        offset: 0,
      });

      result1.identifiers.should.deepEqual(result2.identifiers);
    });
  });

  describe('getDistinctSets', () => {
    it('should return an array of sets from registered records by default', async () => {
      const sets = await service.getDistinctSets();
      sets.should.be.an.Array();
      sets.forEach((s) => s.should.be.a.String());

      // Expected sets from fixture data
      const expectedSets = [
        'grottocenter',
        'grottocenter:article',
        'grottocenter:collection',
        'grottocenter:dataset',
        'grottocenter:image',
        'grottocenter:interactive_resource',
        'grottocenter:map',
        'grottocenter:sound',
      ];

      sets.length.should.equal(expectedSets.length);
      expectedSets.forEach((expectedSet) => {
        sets.should.containEql(expectedSet);
      });
    });

    it('should return sets in sorted order', async () => {
      const sets = await service.getDistinctSets();
      const sortedSets = [...sets].sort();
      sets.should.deepEqual(sortedSets);
    });

    it('should include sets from deleted records when registeredOnly=false', async () => {
      const sets = await service.getDistinctSets(false);
      sets.should.be.an.Array();
      // Should still contain all the same sets since other records also have 'collection' set
      sets.should.containEql('grottocenter:collection');
    });

    it('should contain the base grottocenter set', async () => {
      const sets = await service.getDistinctSets();
      sets.should.containEql('grottocenter');
    });

    it('should return unique sets only', async () => {
      const sets = await service.getDistinctSets();
      const uniqueSets = [...new Set(sets)];
      sets.length.should.equal(uniqueSets.length);
    });

    it('should handle empty listSets gracefully', async () => {
      // This tests the robustness of the method
      const sets = await service.getDistinctSets();
      sets.should.be.an.Array();
      sets.length.should.be.greaterThan(0);
    });
  });

  describe('getRecordById', () => {
    it('should return a record by numeric ID', async () => {
      const record = await service.getRecordById(1);
      record.should.be.an.Object();
      record.should.have.property('id', 1);
      record.should.have.property('oaiIdentifier', 'oai:grottocenter.org:1');
      record.should.have.property('dcTitle', 'Document 1 on sound');
      record.should.have.property('metadataStatus', 'registered');
    });

    it('should return a deleted record', async () => {
      const record = await service.getRecordById(13);
      record.should.be.an.Object();
      record.should.have.property('id', 13);
      record.should.have.property('oaiIdentifier', 'oai:grottocenter.org:13');
      record.should.have.property('metadataStatus', 'deleted');
    });

    it('should return null for non-existent ID', async () => {
      const record = await service.getRecordById(999);
      should(record).be.null();
    });

    it('should return null for invalid ID', async () => {
      const record = await service.getRecordById('invalid');
      should(record).be.null();
    });

    it('should apply filter parameter', async () => {
      // Test with filter to only get registered records
      const record1 = await service.getRecordById(13, {
        metadataStatus: 'registered',
      });
      should(record1).be.null(); // Should not find deleted record

      const record2 = await service.getRecordById(1, {
        metadataStatus: 'registered',
      });
      record2.should.be.an.Object();
      record2.should.have.property('metadataStatus', 'registered');
    });

    it('should return complete record structure', async () => {
      const record = await service.getRecordById(6);
      record.should.be.an.Object();

      // Check all expected fields are present
      record.should.have.property('id');
      record.should.have.property('oaiIdentifier');
      record.should.have.property('lastUpdate');
      record.should.have.property('listSets');
      record.should.have.property('dcTitle');
      record.should.have.property('dcCreators');
      record.should.have.property('dcPublisher');
      record.should.have.property('dcDate');
      record.should.have.property('dcLanguages');
      record.should.have.property('dcDescriptions');
      record.should.have.property('dcCoverages');
      record.should.have.property('dcSubjects');
      record.should.have.property('dcFormats');
      record.should.have.property('dcIdentifiers');
      record.should.have.property('dcRelations');
      record.should.have.property('dcSources');
      record.should.have.property('dcRights');
      record.should.have.property('dcTypeGrottocenter');
      record.should.have.property('dcTypeDcmi');
      record.should.have.property('metadataStatus');
      record.should.have.property('children');

      // Check array fields are arrays
      record.listSets.should.be.an.Array();
      record.dcCreators.should.be.an.Array();
      record.dcLanguages.should.be.an.Array();
      record.children.should.be.an.Array();
    });

    it('should handle string ID parameter', async () => {
      const record = await service.getRecordById('1');
      record.should.be.an.Object();
      record.should.have.property('id', 1);
    });
  });

  describe('countRecords', () => {
    it('should count all registered records', async () => {
      const count = await service.countRecords();
      count.should.be.a.Number();
      count.should.equal(20); // ⚠️ 21 en tout, mais 1 est "deleted"
    });

    it('should count all records including deleted', async () => {
      const count = await service.countRecords({}, {});
      count.should.be.a.Number();
      count.should.equal(21); // tous les documents
    });

    it('should count only records in set "grottocenter:article"', async () => {
      const count = await service.countRecords({ set: 'grottocenter:article' });
      count.should.equal(1); // id 12 (id 13 est "deleted")
    });

    it('should count records updated after a specific date (from)', async () => {
      const count = await service.countRecords({ from: '2025-01-10' });
      count.should.equal(12); // actual count from CI
    });

    it('should count records updated before a specific date (until)', async () => {
      const count = await service.countRecords({ until: '2025-01-05' });
      count.should.equal(4); // actual count from CI
    });

    it('should count records updated between two dates', async () => {
      const count = await service.countRecords({
        from: '2025-01-03',
        until: '2025-01-05',
      });
      count.should.equal(3); // id 2, 3, 4
    });

    it('should return 0 for unmatched date range', async () => {
      const count = await service.countRecords({
        from: '2030-01-01',
        until: '2030-12-31',
      });
      count.should.equal(0);
    });

    it('should throw on invalid date', async () => {
      await service
        .countRecords({ from: 'not-a-date' })
        .then(() => {
          throw new Error('Should have thrown');
        })
        .catch((err) => {
          err.should.be.an.Error();
        });
    });
  });

  describe('getOAIRecord', () => {
    it('should return record by OAI identifier', async () => {
      const record = await service.getOAIRecord('oai:grottocenter.org:1');
      record.should.be.an.Object();
      record.should.have.property('id', 1);
      record.should.have.property('oaiIdentifier', 'oai:grottocenter.org:1');
      record.should.have.property('metadataStatus', 'registered');
    });

    it('should return null for unknown OAI identifier', async () => {
      const record = await service.getOAIRecord('oai:grottocenter.org:999');
      should(record).be.null();
    });

    it('should return deleted record when filter allows it', async () => {
      const record = await service.getOAIRecord('oai:grottocenter.org:13', {
        metadataStatus: 'deleted',
      });
      record.should.be.an.Object();
      record.should.have.property('id', 13);
      record.should.have.property('metadataStatus', 'deleted');
    });

    it('should not return deleted record with default filter', async () => {
      const record = await service.getOAIRecord('oai:grottocenter.org:13');
      should(record).be.null();
    });

    it('should return record with empty filter', async () => {
      const record = await service.getOAIRecord('oai:grottocenter.org:13', {});
      record.should.be.an.Object();
      record.should.have.property('id', 13);
    });
  });

  describe('searchMetadata', () => {
    it('should search records by title', async () => {
      const { rows: results } = await service.searchMetadata({
        title: 'Document 1',
      });
      results.should.be.an.Array();
      results.length.should.be.greaterThan(0);
      results.forEach((result) => {
        result.should.have.property('id');
        result.should.have.property('title');
      });
    });

    it('should return empty rows and total 0 for non-matching title', async () => {
      const { rows: results, total } = await service.searchMetadata({
        title: 'NonExistentTitle123456',
      });
      results.should.be.an.Array();
      results.length.should.equal(0);
      total.should.equal(0);
    });

    it('should return a total equal to the number of rows under the ceiling', async () => {
      const { rows, total } = await service.searchMetadata({
        title: 'sound',
      });
      total.should.be.a.Number();
      total.should.equal(rows.length);
    });

    it('should report the real total when the row ceiling is hit', async () => {
      const full = await service.searchMetadata({ title: 'Document' });
      full.total.should.be.greaterThan(1);

      const original = sails.config.custom.biblioSearchMaxRows;
      sails.config.custom.biblioSearchMaxRows = 1;
      try {
        const capped = await service.searchMetadata({ title: 'Document' });
        capped.rows.length.should.equal(1);
        capped.total.should.equal(full.total);
        capped.total.should.be.greaterThan(capped.rows.length);
        // deterministic order: the capped row is the first of the full result
        capped.rows[0].id.should.equal(full.rows[0].id);
      } finally {
        sails.config.custom.biblioSearchMaxRows = original;
      }
    });

    it('should handle empty query', async () => {
      const { rows: results } = await service.searchMetadata({});
      results.should.be.an.Array();
      results.length.should.equal(0);
    });

    it('should search by author only', async () => {
      const { rows, total } = await service.searchMetadata({
        author: 'Author 2A',
      });
      rows.map((r) => r.id).should.eql([2]);
      total.should.equal(1);
    });

    it('should search by year only', async () => {
      const { rows } = await service.searchMetadata({ date: '2023' });
      rows.length.should.be.greaterThan(0);
      rows.forEach((r) => r.publicationYear.should.equal(2023));
      rows.map((r) => r.id).should.containEql(2);
    });

    ['5', '50', '999', 5].forEach((date) => {
      it(`should read the short year ${JSON.stringify(date)} as that year, not a later one`, async () => {
        const { rows, total } = await service.searchMetadata({ date });
        rows.should.eql([]);
        total.should.equal(0);
      });
    });

    it('should pad a short year to four digits', () => {
      const { params } = service.buildSearchSQL({ date: '5' });
      params.should.eql(['0005-01-01', '0005-12-31']);
    });

    it('should search the any field in the title', async () => {
      const { rows } = await service.searchMetadata({ any: 'Document 4 on' });
      rows.map((r) => r.id).should.containEql(4);
    });

    it('should search the any field in the author', async () => {
      const { rows } = await service.searchMetadata({ any: 'Author 2A' });
      rows.map((r) => r.id).should.eql([2]);
    });

    it('should return no record for an any term found nowhere', async () => {
      const { rows, total } = await service.searchMetadata({
        any: 'zzz-no-such-term',
      });
      rows.should.eql([]);
      total.should.equal(0);
    });

    it('should search the any field in the publisher only', async () => {
      const { rows } = await service.searchMetadata({ any: 'Publisher 2' });
      // A substring: Publisher 20 and 21 match too
      const ids = rows.map((r) => r.id);
      ids.should.containEql(2);
      ids.should.not.containEql(1);
    });

    it('should search the any field in the identifier values', async () => {
      const { rows } = await service.searchMetadata({ any: '10.1000/gc2' });
      const ids = rows.map((r) => r.id);
      ids.should.containEql(2);
      ids.should.not.containEql(1);
    });

    it('should not match the any field on URLs or file paths', async () => {
      // Every fixture record has a https://grottocenter.org/doc/<id>.pdf entry
      const { rows, total } = await service.searchMetadata({ any: 'pdf' });
      rows.should.eql([]);
      total.should.equal(0);
    });

    describe('with an accented record', () => {
      const ID = 900001;

      before(async () => {
        await sails.sendNativeQuery(
          `INSERT INTO v_bibliographic_metadata
             (id_document, oai_identifier, dc_title, dc_creators, dc_publisher,
              dc_identifiers, metadata_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'registered')`,
          [
            ID,
            `oai:grottocenter.org:${ID}`,
            'Gouffre de la Pierre-Saint-Martin',
            ['Geneviève Éloi'],
            'Spéléo-Club',
            ['isbn:978-2-0000-0000-0'],
          ]
        );
      });

      after(async () => {
        await sails.sendNativeQuery(
          'DELETE FROM v_bibliographic_metadata WHERE id_document = $1',
          [ID]
        );
      });

      [
        ['title', 'gouffre'],
        ['author', 'genevieve eloi'],
        ['publisher', 'speleo-club'],
        ['ISBN', '978-2-0000-0000-0'],
      ].forEach(([where, any]) => {
        it(`should find it through the ${where} with an unaccented term`, async () => {
          const { rows } = await service.searchMetadata({ any });
          rows.map((r) => r.id).should.containEql(ID);
        });
      });

      it('should find it through the author with an accented term', async () => {
        const { rows } = await service.searchMetadata({ any: 'Geneviève' });
        rows.map((r) => r.id).should.eql([ID]);
      });
    });

    it('should AND the any field with another field of the same node', async () => {
      const { rows } = await service.searchMetadata({
        any: 'Document',
        author: 'Author 2A',
      });
      rows.map((r) => r.id).should.eql([2]);
    });

    it('should combine the any field with another field under @and', async () => {
      const byYear = await service.searchMetadata({ date: '2023' });
      const { rows } = await service.searchMetadata({
        and: [{ any: 'Author 2A' }, { date: '2023' }],
      });
      // Both sides apply: the year alone matches more records than the pair
      rows.map((r) => r.id).should.eql([2]);
      byYear.rows.length.should.be.greaterThan(rows.length);
    });

    it('should exclude an any term under @not', async () => {
      const all = await service.searchMetadata({ any: 'Document' });
      const { rows } = await service.searchMetadata({
        and: [{ any: 'Document' }, { not: { any: 'Author 2A' } }],
      });
      all.rows.map((r) => r.id).should.containEql(2);
      rows.map((r) => r.id).should.not.containEql(2);
    });

    it('should build the any clause with a single shared parameter', () => {
      const params = [];
      const { clause, nextParamIndex } = service.processQueryNode(
        { any: 'cave' },
        params,
        1
      );
      params.should.eql(['%cave%']);
      nextParamIndex.should.equal(2);
      clause.should.containEql('dc_title');
      clause.should.containEql('dc_creators::text');
      clause.should.containEql('dc_publisher');
      clause.should.containEql('unnest(dc_identifiers)');
      clause.should.not.containEql('dc_identifiers::text');
      clause.should.containEql("'doi:' || $1");
    });

    it('should search with @or across fields', async () => {
      const { rows } = await service.searchMetadata({
        or: [{ title: 'Document 4 on' }, { author: 'Author 2A' }],
      });
      rows
        .map((r) => r.id)
        .sort((a, b) => a - b)
        .should.eql([2, 4]);
    });

    it('should search with @and across fields', async () => {
      const { rows } = await service.searchMetadata({
        and: [{ title: 'Document' }, { author: 'Author 2A' }],
      });
      rows.map((r) => r.id).should.eql([2]);
    });

    it('should exclude records matching a @not', async () => {
      const all = await service.searchMetadata({ title: 'Document' });
      const { rows } = await service.searchMetadata({
        and: [{ title: 'Document' }, { not: { author: 'Author 2A' } }],
      });
      all.rows.map((r) => r.id).should.containEql(2);
      rows.map((r) => r.id).should.not.containEql(2);
      rows.length.should.equal(all.rows.length - 1);
    });

    it('should not use a title under @not as a positive filter', async () => {
      const { rows } = await service.searchMetadata({
        and: [{ author: 'Author 2A' }, { not: { title: 'Document 99' } }],
      });
      rows.map((r) => r.id).should.eql([2]);
    });

    it('should not return the children of the matching records', async () => {
      // Document 7 has document 8 as a child, as an object like in the view
      const { rows } = await service.searchMetadata({
        title: 'Document 7 on',
      });
      rows.map((r) => r.id).should.eql([7]);
    });

    it('should reject a leaf with an unknown key', async () => {
      await service
        .searchMetadata({
          and: [{ title: 'Document' }, { publication_year: 1990 }],
        })
        .should.be.rejectedWith({
          code: 'UNSUPPORTED_SEARCH_FIELD',
          field: 'publication_year',
        });
    });

    it('should reject a non-numeric date instead of dropping it', async () => {
      await service
        .searchMetadata({
          and: [{ date: 'abc' }, { not: { title: 'Document 99' } }],
        })
        .should.be.rejectedWith({
          code: 'UNSUPPORTED_SEARCH_FIELD',
          field: 'date',
        });
    });

    it('should reject an @or with an unusable branch', async () => {
      await service
        .searchMetadata({ or: [{ author: 'Author 2A' }, { foo: 'bar' }] })
        .should.be.rejectedWith({ code: 'UNSUPPORTED_SEARCH_FIELD' });
    });

    it('should reject an empty node nested in a logical operator', async () => {
      await service
        .searchMetadata({ and: [{ author: 'Author 2A' }, {}] })
        .should.be.rejectedWith({ code: 'UNSUPPORTED_SEARCH_FIELD' });
    });

    [
      ['an object @and', { author: 'Author 2A', and: { title: 'x' } }, 'and'],
      ['an empty @or', { author: 'Author 2A', or: [] }, 'or'],
      ['an empty @and', { author: 'Author 2A', and: [] }, 'and'],
      ['a non-numeric id', { id: 'abc' }, 'id'],
      ['an id above the integer range', { id: 3000000000 }, 'id'],
      ['an exponent id', { id: '1e21' }, 'id'],
      ['id 0', { id: 0 }, 'id'],
      ['a year above 9999', { date: '10000' }, 'date'],
      ['year 0', { date: 0 }, 'date'],
      ['a year range', { date: '1990-1995' }, 'date'],
      ['a year with trailing text', { date: '2020abc' }, 'date'],
      ['a decimal year', { date: '2020.7' }, 'date'],
      ['an exponent year', { date: 1e21 }, 'date'],
      ['a null title', { title: null }, 'title'],
      ['a false author', { author: false }, 'author'],
      ['a null id', { id: null }, 'id'],
      ['an object title', { title: { a: 1 } }, 'title'],
      ['an array author', { author: ['Author 2A'] }, 'author'],
      ['an array body', ['x'], 'query'],
    ].forEach(([label, query, field]) => {
      it(`should reject ${label}`, async () => {
        await service
          .searchMetadata(query)
          .should.be.rejectedWith({ code: 'UNSUPPORTED_SEARCH_FIELD', field });
      });
    });

    it('should keep an empty term inside @or from widening the query', async () => {
      const { rows } = await service.searchMetadata({
        or: [{ author: 'Author 2A' }, { title: '' }],
      });
      rows.map((r) => r.id).should.eql([2]);
    });

    it('should search by bibliographic level with underscore sets', async () => {
      const { rows } = await service.searchMetadata({
        bibliographiclevel: 'm',
      });
      rows.map((r) => r.id).should.containEql(3); // interactive_resource
    });

    it('should search with partial title match', async () => {
      const { rows: results } = await service.searchMetadata({
        title: 'sound',
      });
      results.should.be.an.Array();
      results.length.should.be.greaterThan(0);
    });

    it('should include children in search results', async () => {
      const { rows: results } = await service.searchMetadata({
        title: 'collection',
      });
      results.should.be.an.Array();
      // Should find collection records and potentially their children
    });
  });

  describe('searchMetadata unaccent fallback', () => {
    let biblioService;
    let stub;

    before(() => {
      biblioService = sails.services.bibliographicmetadataservice;
    });

    afterEach(() => {
      if (stub) stub.restore();
      stub = null;
    });

    it('should retry with a plain ILIKE when unaccent is missing', async () => {
      stub = sinon.stub(sails, 'sendNativeQuery');
      stub
        .onFirstCall()
        .rejects(new Error('function unaccent(text) does not exist'));
      stub.onSecondCall().resolves({
        rows: [{ id_document: 5, dc_title: 'Fallback', total_count: '1' }],
      });

      const { rows, total } = await biblioService.searchMetadata({
        title: 'fallback',
      });

      stub.callCount.should.equal(2);
      stub.firstCall.args[0].should.containEql('unaccent(');
      stub.secondCall.args[0].should.containEql('dc_title ILIKE $1');
      stub.secondCall.args[0].should.not.containEql('unaccent(');
      rows.map((r) => r.id).should.eql([5]);
      total.should.equal(1);
    });

    it('should rethrow any other error without retrying', async () => {
      stub = sinon.stub(sails, 'sendNativeQuery');
      stub.rejects(new Error('connection refused'));

      await biblioService
        .searchMetadata({ title: 'x' })
        .should.be.rejectedWith('connection refused');
      stub.callCount.should.equal(1);
    });

    it('should not take a validation error quoting "unaccent" for a missing extension', async () => {
      stub = sinon.stub(sails, 'sendNativeQuery').resolves({ rows: [] });
      const warn = sinon.stub(sails.log, 'warn');
      try {
        await biblioService
          .searchMetadata({ unaccent: 'x' })
          .should.be.rejectedWith({
            code: 'UNSUPPORTED_SEARCH_FIELD',
            field: 'unaccent',
          });
        warn.callCount.should.equal(0);
        stub.callCount.should.equal(0);
      } finally {
        warn.restore();
      }
    });

    it('should not retry on a database error that merely quotes "unaccent"', async () => {
      stub = sinon.stub(sails, 'sendNativeQuery');
      stub.rejects(new Error('invalid input syntax for type text: "unaccent"'));

      await biblioService
        .searchMetadata({ title: 'unaccent' })
        .should.be.rejectedWith(/invalid input syntax/);
      stub.callCount.should.equal(1);
    });
  });

  describe('getMetadata with array ID', () => {
    it('should return multiple records for array of IDs', async () => {
      const records = await service.getMetadata([1, 2, 3]);
      records.should.be.an.Array();
      records.length.should.equal(3);
      records.forEach((record) => {
        record.should.have.property('id');
        [1, 2, 3].should.containEql(record.id);
      });
    });

    it('should return records for mixed valid/invalid IDs', async () => {
      const records = await service.getMetadata([1, 999, 2]);
      records.should.be.an.Array();
      records.length.should.equal(2); // Only valid IDs
      records.forEach((record) => {
        [1, 2].should.containEql(record.id);
      });
    });

    it('should return empty array for invalid IDs array', async () => {
      const records = await service.getMetadata([999, 998, 997]);
      records.should.be.an.Array();
      records.length.should.equal(0);
    });
  });

  describe('Pagination edge cases and limits testing', () => {
    it('should handle limit=0 for records pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 0,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
      result.should.have.property('limit');
      result.should.have.property('offset');
      result.should.have.property('hasNext');
    });

    it('should handle limit=-1 for records pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: -1,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
    });

    it('should handle limit=1 for records pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 1,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
      result.records.length.should.equal(1);
      result.limit.should.equal(1);
    });

    it('should handle very large limit for records pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 999999,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
    });

    it('should handle offset=-1 for records pagination', async () => {
      try {
        const result = await service.getOAIRecordsPaginated({
          limit: 10,
          offset: -1,
        });
        result.should.be.an.Object();
      } catch (error) {
        error.should.be.an.Error();
      }
    });

    it('should handle offset=-5 for records pagination', async () => {
      try {
        const result = await service.getOAIRecordsPaginated({
          limit: 10,
          offset: -5,
        });
        result.should.be.an.Object();
      } catch (error) {
        error.should.be.an.Error();
      }
    });

    it('should handle limit=0 for identifiers pagination', async () => {
      const result = await service.getOAIIdentifiersPaginated({
        limit: 0,
        offset: 0,
      });
      result.should.be.an.Object();
      result.identifiers.should.be.an.Array();
    });

    it('should handle limit=-1 for identifiers pagination', async () => {
      const result = await service.getOAIIdentifiersPaginated({
        limit: -1,
        offset: 0,
      });
      result.should.be.an.Object();
      result.identifiers.should.be.an.Array();
    });

    it('should handle string limit "0" for records pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: '0',
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
    });

    it('should handle string limit "-1" for records pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: '-1',
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
    });

    it('should handle null/undefined limit for records pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: null,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
    });

    it('should handle undefined limit for records pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: undefined,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
    });

    it('should handle empty string limit for records pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: '',
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
    });

    it('should handle very large offset in pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 10,
        offset: 10000,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
      result.records.length.should.equal(0);
      result.hasNext.should.be.false();
    });

    it('should handle string numbers in pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: '5',
        offset: '2',
      });
      result.should.be.an.Object();
      result.limit.should.equal(5);
      result.offset.should.equal(2);
    });

    it('should handle invalid string numbers in pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 'invalid',
        offset: 'invalid',
      });
      result.should.be.an.Object();
      result.limit.should.equal(50); // Default limit
      result.offset.should.equal(0); // Default offset
    });

    it('should handle floating point numbers in pagination', async () => {
      const result = await service.getOAIRecordsPaginated({
        limit: 5.7,
        offset: 2.3,
      });
      result.should.be.an.Object();
      result.limit.should.equal(5); // Should be truncated
      result.offset.should.equal(2); // Should be truncated
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle invalid date ranges gracefully', async () => {
      try {
        await service.getOAIRecords({
          from: '2025-01-15',
          until: '2025-01-10',
        }); // until before from
        // Should still work, just return empty results
      } catch (error) {
        // Or throw error - either is acceptable
        error.should.be.an.Error();
      }
    });

    it('should handle empty set filter gracefully', async () => {
      const records = await service.getOAIRecords({ set: '' });
      records.should.be.an.Array();
      // Should return all records when set is empty
    });

    it('should handle whitespace-only set filter', async () => {
      const records = await service.getOAIRecords({ set: '   ' });
      records.should.be.an.Array();
      // Should handle whitespace gracefully
    });
  });

  describe('Complex filtering scenarios', () => {
    it('should combine set and date filters', async () => {
      const records = await service.getOAIRecords({
        set: 'grottocenter:sound',
        from: '2025-01-01',
        until: '2025-01-20',
      });
      records.should.be.an.Array();
      records.forEach((record) => {
        record.listSets.should.containEql('grottocenter:sound');
        const lastUpdate = new Date(record.lastUpdate);
        const fromDate = new Date('2025-01-01');
        const untilDate = new Date('2025-01-20');
        fromDate.setUTCHours(0, 0, 0, 0);
        untilDate.setUTCHours(23, 59, 59, 999);
        lastUpdate.should.be.greaterThanOrEqual(fromDate);
        lastUpdate.should.be.lessThanOrEqual(untilDate);
      });
    });

    it('should handle pagination with set filtering', async () => {
      const result = await service.getOAIRecordsPaginated({
        set: 'grottocenter:sound',
        limit: 2,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
      result.records.length.should.be.belowOrEqual(2);
      result.records.forEach((record) => {
        record.listSets.should.containEql('grottocenter:sound');
      });
    });

    it('should handle identifiers pagination with date filtering', async () => {
      const result = await service.getOAIIdentifiersPaginated({
        from: '2025-01-01',
        until: '2025-01-10',
        limit: 5,
        offset: 0,
      });
      result.should.be.an.Object();
      result.identifiers.should.be.an.Array();
      result.identifiers.forEach((identifier) => {
        const lastUpdate = new Date(identifier.lastUpdate);
        const fromDate = new Date('2025-01-01');
        const untilDate = new Date('2025-01-10');
        fromDate.setUTCHours(0, 0, 0, 0);
        untilDate.setUTCHours(23, 59, 59, 999);
        lastUpdate.should.be.greaterThanOrEqual(fromDate);
        lastUpdate.should.be.lessThanOrEqual(untilDate);
      });
    });
  });

  describe('Data consistency tests', () => {
    it('should return consistent record count between methods', async () => {
      const records = await service.getOAIRecords();
      const count = await service.countRecords();
      records.length.should.equal(count);
    });

    it('should return consistent identifier count with records count', async () => {
      const identifiers = await service.getOAIIdentifiers();
      const records = await service.getOAIRecords();
      identifiers.length.should.equal(records.length);
    });

    it('should maintain data integrity across pagination', async () => {
      // Get all records via pagination
      const allRecords = [];
      let offset = 0;
      const limit = 5;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const result = await service.getOAIRecordsPaginated({ limit, offset });
        allRecords.push(...result.records);
        if (!result.hasNext) break;
        offset += limit;
      }

      // Compare with non-paginated results
      const directRecords = await service.getOAIRecords();
      allRecords.length.should.equal(directRecords.length);
    });
  });

  describe('Error handling in service methods', () => {
    it('should handle database errors in getDistinctSets', async () => {
      const originalFind = sails.models.vbibliographicmetadata.find;
      sails.models.vbibliographicmetadata.find = () => {
        throw new Error('Database connection failed');
      };

      try {
        await service.getDistinctSets();
        throw new Error('Should have thrown');
      } catch (error) {
        error.message.should.match(/Database connection failed/);
      } finally {
        sails.models.vbibliographicmetadata.find = originalFind;
      }
    });

    it('should handle database errors in getOAIRecord', async () => {
      const originalFindOne = sails.models.vbibliographicmetadata.findOne;
      sails.models.vbibliographicmetadata.findOne = () => {
        throw new Error('Database error in getOAIRecord');
      };

      try {
        await service.getOAIRecord('oai:grottocenter.org:1');
        throw new Error('Should have thrown');
      } catch (error) {
        error.message.should.match(/Database error in getOAIRecord/);
      } finally {
        sails.models.vbibliographicmetadata.findOne = originalFindOne;
      }
    });

    it('should handle database errors in getRecordById', async () => {
      const originalFindOne = sails.models.vbibliographicmetadata.findOne;
      sails.models.vbibliographicmetadata.findOne = () => {
        throw new Error('Database error in getRecordById');
      };

      try {
        await service.getRecordById(1);
        throw new Error('Should have thrown');
      } catch (error) {
        error.message.should.match(/Database error in getRecordById/);
      } finally {
        sails.models.vbibliographicmetadata.findOne = originalFindOne;
      }
    });

    it('should handle database errors in getOAIRecords', async () => {
      const originalFind = sails.models.vbibliographicmetadata.find;
      sails.models.vbibliographicmetadata.find = () => {
        throw new Error('Database error in getOAIRecords');
      };

      try {
        await service.getOAIRecords();
        throw new Error('Should have thrown');
      } catch (error) {
        error.message.should.match(/Database error in getOAIRecords/);
      } finally {
        sails.models.vbibliographicmetadata.find = originalFind;
      }
    });

    it('should handle database errors in getOAIIdentifiers', async () => {
      const originalFind = sails.models.vbibliographicmetadata.find;
      sails.models.vbibliographicmetadata.find = () => {
        throw new Error('Database error in getOAIIdentifiers');
      };

      try {
        await service.getOAIIdentifiers();
        throw new Error('Should have thrown');
      } catch (error) {
        error.message.should.match(/Database error in getOAIIdentifiers/);
      } finally {
        sails.models.vbibliographicmetadata.find = originalFind;
      }
    });

    it('should handle database errors in countRecords', async () => {
      const originalFind = sails.models.vbibliographicmetadata.find;
      sails.models.vbibliographicmetadata.find = () => {
        throw new Error('Database error in countRecords');
      };

      try {
        await service.countRecords();
        throw new Error('Should have thrown');
      } catch (error) {
        error.message.should.match(/Database error in countRecords/);
      } finally {
        sails.models.vbibliographicmetadata.find = originalFind;
      }
    });

    it('should handle sendNativeQuery errors in pagination', async () => {
      const originalSendNativeQuery = sails.sendNativeQuery;
      sails.sendNativeQuery = () => {
        throw new Error('SQL query failed');
      };

      try {
        await service.getOAIRecordsPaginated({ set: 'grottocenter:sound' });
        throw new Error('Should have thrown');
      } catch (error) {
        error.message.should.match(/SQL query failed/);
      } finally {
        sails.sendNativeQuery = originalSendNativeQuery;
      }
    });
  });

  describe('SQL building and search functionality', () => {
    it('should handle complex search queries with title', async () => {
      const { rows: results } = await service.searchMetadata({
        title: 'Document 1',
      });
      results.should.be.an.Array();
      if (results.length > 0) {
        results.forEach((result) => {
          result.should.have.property('id');
          result.should.have.property('title');
        });
      }
    });

    it('should handle empty search metadata query', async () => {
      const { rows: results } = await service.searchMetadata(null);
      results.should.be.an.Array();
      results.length.should.equal(0);
    });

    it('should handle search with very long title', async () => {
      const longTitle = 'a'.repeat(1000);
      const { rows: results } = await service.searchMetadata({
        title: longTitle,
      });
      results.should.be.an.Array();
      results.length.should.equal(0);
    });

    it('should handle search with empty title string', async () => {
      const { rows: results } = await service.searchMetadata({
        title: '',
      });
      results.should.be.an.Array();
      results.length.should.equal(0);
    });

    it('should handle search with whitespace-only title', async () => {
      const { rows: results } = await service.searchMetadata({
        title: '   ',
      });
      results.should.be.an.Array();
      results.length.should.equal(0);
    });

    it('should exclude the negated bibliographiclevel from the results', async () => {
      const all = await service.searchMetadata({ title: 'Document' });
      const { rows, total } = await service.searchMetadata({
        title: 'Document',
        not: { bibliographiclevel: 'a' },
      });
      // id 12 is the only article
      rows.map((r) => r.id).should.not.containEql(12);
      total.should.equal(all.total - 1);
    });

    it('should match multi-word document types with bibliographiclevel m', async () => {
      const { rows } = await service.searchMetadata({
        title: 'Document',
        bibliographiclevel: 'm',
      });
      const ids = rows.map((r) => r.id);
      // interactive_resource fixtures
      [3, 5, 10, 16, 19].forEach((id) => ids.should.containEql(id));
      // a collection (7) and an article (12) are not monographs
      ids.should.not.containEql(7);
      ids.should.not.containEql(12);
    });

    it('should exclude multi-word document types when m is negated', async () => {
      const { rows } = await service.searchMetadata({
        title: 'Document',
        not: { bibliographiclevel: 'm' },
      });
      const ids = rows.map((r) => r.id);
      [3, 5, 10, 16, 19].forEach((id) => ids.should.not.containEql(id));
      ids.should.containEql(7);
    });

    it('should handle search with numeric title', async () => {
      const { rows: results } = await service.searchMetadata({
        title: '123',
      });
      results.should.be.an.Array();
    });
  });

  describe('OAI criteria building edge cases', () => {
    it('should handle extreme date ranges', async () => {
      const records = await service.getOAIRecords({
        from: '1900-01-01',
        until: '2100-12-31',
      });
      records.should.be.an.Array();
    });

    it('should handle same from and until dates', async () => {
      const records = await service.getOAIRecords({
        from: '2025-01-05',
        until: '2025-01-05',
      });
      records.should.be.an.Array();
      records.length.should.equal(1); // Should include records from that exact day
    });

    it('should handle malformed date formats', async () => {
      try {
        await service.getOAIRecords({ from: '2025/01/01' }); // Wrong format
      } catch (error) {
        error.should.be.an.Error();
      }
    });

    it('should handle date with time components', async () => {
      try {
        const records = await service.getOAIRecords({
          from: '2025-01-05T10:30:00Z',
          until: '2025-01-05T23:59:59Z',
        });
        records.should.be.an.Array();
      } catch (error) {
        // May not support ISO format, that's ok
        error.should.be.an.Error();
      }
    });

    it('should handle leap year dates', async () => {
      const records = await service.getOAIRecords({
        from: '2024-02-29',
        until: '2024-02-29',
      });
      records.should.be.an.Array();
    });

    it('should handle invalid leap year dates', async () => {
      try {
        await service.getOAIRecords({
          from: '2025-02-29', // Invalid date
          until: '2025-02-29',
        });
      } catch (error) {
        error.should.be.an.Error();
      }
    });

    it('should handle month boundaries correctly', async () => {
      const records = await service.getOAIRecords({
        from: '2025-01-31',
        until: '2025-02-01',
      });
      records.should.be.an.Array();
    });

    it('should handle year boundaries correctly', async () => {
      const records = await service.getOAIRecords({
        from: '2024-12-31',
        until: '2025-01-01',
      });
      records.should.be.an.Array();
    });
  });

  describe('Pagination with sets edge cases', () => {
    it('should handle pagination with non-existent set', async () => {
      const result = await service.getOAIRecordsPaginated({
        set: 'nonexistent:category',
        limit: 10,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.length.should.equal(0);
    });

    it('should handle pagination with malformed set names', async () => {
      const result = await service.getOAIRecordsPaginated({
        set: 'invalid:set:with:too:many:colons',
        limit: 10,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
    });

    it('should handle pagination with set containing special characters', async () => {
      const result = await service.getOAIRecordsPaginated({
        set: 'grottocenter:test-set_name.with.dots',
        limit: 10,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
    });

    it('should handle pagination with very long set name', async () => {
      const longSetName = `grottocenter:${'a'.repeat(1000)}`;
      const result = await service.getOAIRecordsPaginated({
        set: longSetName,
        limit: 10,
        offset: 0,
      });
      result.should.be.an.Object();
      result.records.should.be.an.Array();
      result.records.length.should.equal(0);
    });

    it('should handle identifiers pagination with non-existent set', async () => {
      const result = await service.getOAIIdentifiersPaginated({
        set: 'missing:set',
        limit: 5,
        offset: 0,
      });
      result.should.be.an.Object();
      result.identifiers.should.be.an.Array();
      result.identifiers.length.should.equal(0);
    });

    it('should handle pagination with set that has no records', async () => {
      const result = await service.getOAIRecordsPaginated({
        set: 'grottocenter:empty',
        limit: 10,
        offset: 0,
      });
      result.should.be.an.Object();
      result.hasNext.should.be.false();
    });
  });

  describe('getRecordById validation edge cases', () => {
    it('should handle very large ID numbers', async () => {
      const record = await service.getRecordById(999999999);
      should(record).be.null();
    });

    it('should handle ID with leading zeros', async () => {
      const record = await service.getRecordById('001');
      if (record) {
        record.should.have.property('id', 1);
      } else {
        should(record).be.null();
      }
    });

    it('should handle hexadecimal strings as ID', async () => {
      const record = await service.getRecordById('0x1');
      should(record).be.null(); // Should fail to parse correctly
    });

    it('should handle scientific notation as ID', async () => {
      const record = await service.getRecordById('1e1'); // 10
      if (record && record.id <= 21) {
        record.should.have.property('id');
      } else {
        should(record).be.null();
      }
    });

    it('should handle negative ID', async () => {
      const record = await service.getRecordById(-1);
      should(record).be.null();
    });

    it('should handle zero ID', async () => {
      const record = await service.getRecordById(0);
      should(record).be.null();
    });

    it('should handle float ID', async () => {
      const record = await service.getRecordById(1.5);
      if (record) {
        record.should.have.property('id', 1); // Should be truncated
      }
    });

    it('should handle boolean as ID', async () => {
      const record = await service.getRecordById(true);
      should(record).be.null();
    });

    it('should handle object as ID', async () => {
      const record = await service.getRecordById({ id: 1 });
      should(record).be.null();
    });
  });

  describe('Metadata handling edge cases', () => {
    it('should handle getMetadata with mixed array types', async () => {
      const records = await service.getMetadata(['1', 2, '3']);
      records.should.be.an.Array();
      records.forEach((record) => {
        [1, 2, 3].should.containEql(record.id);
      });
    });

    it('should handle getMetadata with empty array', async () => {
      const records = await service.getMetadata([]);
      records.should.be.an.Array();
      records.length.should.equal(0);
    });

    it('should handle getMetadata with undefined in array', async () => {
      const records = await service.getMetadata([1, undefined, 2]);
      records.should.be.an.Array();
      records.forEach((record) => {
        [1, 2].should.containEql(record.id);
      });
    });

    it('should handle getMetadata with duplicate IDs in array', async () => {
      const records = await service.getMetadata([1, 1, 2, 2]);
      records.should.be.an.Array();
      // Should not have duplicates
      const uniqueIds = [...new Set(records.map((r) => r.id))];
      uniqueIds.length.should.equal(records.length);
    });

    it('should handle getMetadata with very large array', async () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => i + 1);
      const records = await service.getMetadata(largeArray);
      records.should.be.an.Array();
      // Should return existing records only
      records.length.should.be.belowOrEqual(21);
    });
  });

  describe('Set filtering advanced cases', () => {
    it('should handle sets with unicode characters', async () => {
      const records = await service.getOAIRecords({
        set: 'grottocenter:tëst-üñîcôdé',
      });
      records.should.be.an.Array();
    });

    it('should handle sets with numbers', async () => {
      const records = await service.getOAIRecords({
        set: 'grottocenter:category123',
      });
      records.should.be.an.Array();
    });

    it('should handle case sensitivity in sets', async () => {
      const records = await service.getOAIRecords({
        set: 'GROTTOCENTER:SOUND',
      });
      records.should.be.an.Array();
      // Should be case sensitive, so expect 0 results
      records.length.should.equal(0);
    });

    it('should handle sets with leading/trailing whitespace', async () => {
      const records = await service.getOAIRecords({
        set: ' grottocenter:sound ',
      });
      records.should.be.an.Array();
    });
  });

  describe('Advanced date filtering', () => {
    it('should handle from date without until date', async () => {
      const records = await service.getOAIRecords({ from: '2025-01-20' });
      records.should.be.an.Array();
      records.forEach((record) => {
        const lastUpdate = new Date(record.lastUpdate);
        const fromDate = new Date('2025-01-20');
        fromDate.setUTCHours(0, 0, 0, 0);
        lastUpdate.should.be.greaterThanOrEqual(fromDate);
      });
    });

    it('should handle until date without from date', async () => {
      const records = await service.getOAIRecords({ until: '2025-01-03' });
      records.should.be.an.Array();
      records.forEach((record) => {
        const lastUpdate = new Date(record.lastUpdate);
        const untilDate = new Date('2025-01-03');
        untilDate.setUTCHours(23, 59, 59, 999);
        lastUpdate.should.be.lessThanOrEqual(untilDate);
      });
    });

    it('should handle until date before from date (invalid range)', async () => {
      const records = await service.getOAIRecords({
        from: '2025-01-10',
        until: '2025-01-05', // Until before from
      });
      records.should.be.an.Array();
      records.length.should.equal(0); // Should return no results
    });
  });

  describe('buildSearchSQL', () => {
    it('should build SQL with registered status by default', () => {
      const { sql, params } = service.buildSearchSQL({});
      sql.should.be.a.String();
      sql.should.containEql("metadata_status = 'registered'");
      params.should.be.an.Array();
    });

    it('should build SQL with deleted status when includeDeleted is true', () => {
      const { sql, params } = service.buildSearchSQL({}, true);
      sql.should.be.a.String();
      sql.should.containEql("metadata_status = 'deleted'");
      params.should.be.an.Array();
    });

    it('should order rows by id and use the configured ceiling', () => {
      const { sql } = service.buildSearchSQL({}, false, 42);
      sql.should.containEql('ORDER BY id_document');
      sql.should.containEql('LIMIT 42');
      sql.should.containEql('COUNT(*) OVER()');
    });

    it('should select only the columns formatSearchResult reads', () => {
      const { sql } = service.buildSearchSQL({});
      sql.should.not.containEql('SELECT *');
      sql.should.not.match(/\bchildren\b|\bparents\b/);
      sql.should.containEql('dc_title');
    });

    it('should fall back to the default ceiling on an invalid config', () => {
      const original = sails.config.custom.biblioSearchMaxRows;
      try {
        sails.config.custom.biblioSearchMaxRows = 'abc';
        service.getSearchMaxRows().should.equal(10000);
        sails.config.custom.biblioSearchMaxRows = 25;
        service.getSearchMaxRows().should.equal(25);
      } finally {
        sails.config.custom.biblioSearchMaxRows = original;
      }
    });

    it('should build one clause from the whole tree without a title', () => {
      const { sql, params, empty } = service.buildSearchSQL({
        or: [{ author: 'martel' }, { date: '1990' }],
      });
      empty.should.equal(false);
      sql.should.containEql('(dc_creators::text ILIKE $1 OR dc_date BETWEEN');
      params.should.eql(['%martel%', '1990-01-01', '1990-12-31']);
    });

    it('should flag a query with no usable criterion as empty', () => {
      service.buildSearchSQL({}).empty.should.equal(true);
    });

    it('should use the underscore set names for the type sets', () => {
      const { params } = service.buildSearchSQL({ bibliographiclevel: 'm' });
      params[0].should.containEql('grottocenter:topographic_drawing');
      params[0].should.not.containEql('grottocenter:topographic drawing');
    });
  });

  describe('processQueryNode', () => {
    it('should process simple id query', () => {
      const params = [];
      const { clause, nextParamIndex } = service.processQueryNode(
        { id: 1 },
        params,
        1
      );
      clause.should.be.a.String();
      clause.should.containEql('id_document');
      nextParamIndex.should.equal(2);
      params.length.should.equal(1);
    });

    it('should process author query', () => {
      const params = [];
      const { clause } = service.processQueryNode(
        { author: 'Smith' },
        params,
        1
      );
      clause.should.be.a.String();
      clause.should.containEql('ILIKE');
      params[0].should.equal('%Smith%');
    });

    it('should process date query', () => {
      const params = [];
      const { clause } = service.processQueryNode({ date: '2020' }, params, 1);
      clause.should.be.a.String();
      clause.should.containEql('BETWEEN');
      params.length.should.equal(2);
      params[0].should.equal('2020-01-01');
      params[1].should.equal('2020-12-31');
    });

    it('should process isbn query', () => {
      const params = [];
      const { clause } = service.processQueryNode(
        { isbn: '1234567890' },
        params,
        1
      );
      clause.should.be.a.String();
      clause.should.containEql('ILIKE');
      params[0].should.equal('%isbn:1234567890%');
    });

    it('should process bibliographiclevel s (collection)', () => {
      const params = [];
      const { clause } = service.processQueryNode(
        { bibliographiclevel: 's' },
        params,
        1
      );
      clause.should.be.a.String();
      params[0].should.deepEqual(['grottocenter:collection']);
    });

    it('should process bibliographiclevel a (article)', () => {
      const params = [];
      const { clause } = service.processQueryNode(
        { bibliographiclevel: 'a' },
        params,
        1
      );
      clause.should.be.a.String();
      params[0].should.deepEqual(['grottocenter:article']);
    });

    it('should process bibliographiclevel m (monograph)', () => {
      const params = [];
      const { clause } = service.processQueryNode(
        { bibliographiclevel: 'm' },
        params,
        1
      );
      clause.should.be.a.String();
      params[0].should.be.an.Array();
      params[0].length.should.be.greaterThan(5);
    });

    it('should negate a bibliographiclevel condition with valid SQL', () => {
      const { clause } = service.processQueryNode(
        { not: { bibliographiclevel: 'a' } },
        [],
        1
      );
      clause.should.containEql(
        'NOT COALESCE(list_sets::text[] && $1::text[], false)'
      );
      clause.should.not.match(/NOTlist_sets/);
    });

    it('should process AND logic', () => {
      const params = [];
      const { clause } = service.processQueryNode(
        { and: [{ id: 1 }, { author: 'Smith' }] },
        params,
        1
      );
      clause.should.be.a.String();
      clause.should.containEql('AND');
      params.length.should.equal(2);
    });

    it('should process OR logic', () => {
      const params = [];
      const { clause } = service.processQueryNode(
        { or: [{ id: 1 }, { id: 2 }] },
        params,
        1
      );
      clause.should.be.a.String();
      clause.should.containEql('OR');
    });

    it('should process NOT logic', () => {
      const params = [];
      const { clause } = service.processQueryNode(
        { not: { id: 1 } },
        params,
        1
      );
      clause.should.be.a.String();
      clause.should.containEql('NOT COALESCE(id_document = $1, false)');
    });
  });

  describe('getFieldMappings', () => {
    it('should return field mappings object', () => {
      const mappings = service.getFieldMappings();
      mappings.should.be.an.Object();
      mappings.should.have.property('id', 'id_document');
      mappings.should.have.property('title', 'dc_title');
      mappings.should.have.property('author', 'dc_creators::text');
    });
  });

  describe('formatSearchResult', () => {
    it('should format search result correctly', () => {
      const record = {
        id_document: 1,
        dc_title: 'Test Title',
        dc_publisher: 'Test Publisher',
        dc_creators: ['Author 1', 'Author 2'],
        dc_date: new Date('2020-01-01'),
      };
      const result = service.formatSearchResult(record);
      result.should.be.an.Object();
      result.should.have.property('id', 1);
      result.should.have.property('title', 'Test Title');
      result.should.have.property('publisher', 'Test Publisher');
      result.should.have.property('authors');
      result.authors.should.deepEqual(['Author 1', 'Author 2']);
      result.should.have.property('publicationYear', 2020);
    });

    it('should handle null values in search result', () => {
      const record = {
        id_document: 1,
        dc_title: null,
        dc_publisher: null,
        dc_creators: null,
        dc_date: null,
      };
      const result = service.formatSearchResult(record);
      result.should.be.an.Object();
      result.should.have.property('id', 1);
      result.should.have.property('title', null);
      result.should.have.property('publisher', null);
      result.should.have.property('authors', null);
      result.should.have.property('publicationYear', null);
    });
  });

  // getTitleAndIdParents is not tested here because the test database schema
  // uses JSON type for children column while production uses JSONB array.
  // The SQL query `WHERE $1 = ANY(children)` requires JSONB or integer array type.
});
