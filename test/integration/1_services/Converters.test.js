const should = require('should');
const converters = require('../../../api/services/mapping/converters');

describe('Converters Service', () => {
  describe('toDocumentDescriptions()', () => {
    it('should return empty object when sources is null', () => {
      const result = converters.toDocumentDescriptions(null);
      should(result).eql({});
    });

    it('should return empty object when sources is undefined', () => {
      const result = converters.toDocumentDescriptions(undefined);
      should(result).eql({});
    });

    it('should return empty object when all descriptions are deleted', () => {
      const result = converters.toDocumentDescriptions([
        { title: 'Test', body: 'Body', isDeleted: true },
      ]);
      should(result).eql({});
    });

    it('should return title and description from first non-deleted item', () => {
      const result = converters.toDocumentDescriptions([
        { title: 'Test', body: 'Body', isDeleted: false },
      ]);
      should(result).eql({ title: 'Test', description: 'Body' });
    });
  });

  describe('toCaver()', () => {
    it('should convert caver with string-based collections', () => {
      const source = {
        id: 1,
        nickname: 'TestCaver',
        exploredEntrances: '1,2,3',
      };
      const result = converters.toCaver(source);
      should(result.id).equal(1);
      should(result.exploredEntrances).eql([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });

    it('should handle missing collections', () => {
      const source = { id: 1, nickname: 'TestCaver' };
      const result = converters.toCaver(source);
      should(result.id).equal(1);
      should(result.exploredEntrances).be.undefined();
    });

    it('should convert grottos to organizations', () => {
      const source = {
        id: 1,
        nickname: 'TestCaver',
        grottos: '1,2',
      };
      const result = converters.toCaver(source);
      should(result.organizations).eql([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('toSimpleComment()', () => {
    it('should include t_id for snapshots', () => {
      const source = {
        id: 1,
        t_id: 100,
        title: 'Test',
      };
      const result = converters.toSimpleComment(source);
      should(result.t_id).equal(100);
    });

    it('should not include t_id when not present', () => {
      const source = {
        id: 1,
        title: 'Test',
      };
      const result = converters.toSimpleComment(source);
      should(result.t_id).be.undefined();
    });
  });

  describe('toSimpleDescription()', () => {
    it('should include t_id for snapshots', () => {
      const source = {
        id: 1,
        t_id: 100,
        title: 'Test',
      };
      const result = converters.toSimpleDescription(source);
      should(result.t_id).equal(100);
    });

    it('should not include t_id when not present', () => {
      const source = {
        id: 1,
        title: 'Test',
      };
      const result = converters.toSimpleDescription(source);
      should(result.t_id).be.undefined();
    });
  });

  describe('toSimpleHistory()', () => {
    it('should include t_id for snapshots', () => {
      const source = {
        id: 1,
        t_id: 100,
        body: 'Test',
      };
      const result = converters.toSimpleHistory(source);
      should(result.t_id).equal(100);
    });

    it('should not include t_id when not present', () => {
      const source = {
        id: 1,
        body: 'Test',
      };
      const result = converters.toSimpleHistory(source);
      should(result.t_id).be.undefined();
    });
  });

  describe('toSimpleLocation()', () => {
    it('should include t_id for snapshots', () => {
      const source = {
        id: 1,
        t_id: 100,
        body: 'Test',
      };
      const result = converters.toSimpleLocation(source);
      should(result.t_id).equal(100);
    });

    it('should not include t_id when not present', () => {
      const source = {
        id: 1,
        body: 'Test',
      };
      const result = converters.toSimpleLocation(source);
      should(result.t_id).be.undefined();
    });
  });

  describe('toSimpleRigging()', () => {
    it('should include t_id for snapshots', () => {
      const source = {
        id: 1,
        t_id: 100,
        title: 'Test',
      };
      const result = converters.toSimpleRigging(source);
      should(result.t_id).equal(100);
    });

    it('should not include t_id when not present', () => {
      const source = {
        id: 1,
        title: 'Test',
      };
      const result = converters.toSimpleRigging(source);
      should(result.t_id).be.undefined();
    });
  });

  describe('toSimpleCave()', () => {
    it('should prioritize caveLength over length', () => {
      const source = {
        id: 1,
        caveLength: 100,
        length: 50,
      };
      const result = converters.toSimpleCave(source);
      should(result.length).equal(100);
    });

    it('should use length when caveLength is null', () => {
      const source = {
        id: 1,
        length: 50,
      };
      const result = converters.toSimpleCave(source);
      should(result.length).equal(50);
    });

    it('should return null when both are missing', () => {
      const source = { id: 1 };
      const result = converters.toSimpleCave(source);
      should(result.length).be.null();
    });

    it('should not include exploringOrganizations', () => {
      const source = {
        id: 1,
        exploringOrganizations: [
          {
            id: 1,
            name: 'Test Org',
            isDeleted: false,
            names: [{ name: 'Test Org', isMain: true, language: 'eng' }],
          },
        ],
      };
      const result = converters.toSimpleCave(source);
      should(result.exploringOrganizations).be.undefined();
    });

    it('should extract entrance IDs from Waterline objects', () => {
      const source = {
        id: 1,
        entrances: [
          { id: 5, name: 'Entrance A' },
          { id: 6, name: 'Entrance B' },
        ],
      };
      const result = converters.toSimpleCave(source);
      should(result.entrances).deepEqual([5, 6]);
    });

    it('should pass through plain entrance IDs (Typesense format)', () => {
      const source = {
        id: 1,
        nbEntrances: 3,
        entrances: [20, 21, 25877],
      };
      const result = converters.toSimpleCave(source);
      should(result.entrances).deepEqual([20, 21, 25877]);
    });

    it('should pass through string entrance IDs', () => {
      const source = {
        id: 1,
        nbEntrances: 2,
        entrances: ['20', '21'],
      };
      const result = converters.toSimpleCave(source);
      should(result.entrances).deepEqual(['20', '21']);
    });

    it('should filter out null entries from entrances array', () => {
      const source = {
        id: 1,
        entrances: [{ id: 5 }, null, { id: 6 }, undefined],
      };
      const result = converters.toSimpleCave(source);
      should(result.entrances).deepEqual([5, 6]);
    });

    it('should return an empty array when entrances is empty', () => {
      const source = { id: 1, entrances: [] };
      const result = converters.toSimpleCave(source);
      should(result.entrances).deepEqual([]);
    });

    it('should return undefined entrances when field is absent', () => {
      const source = { id: 1, nbEntrances: 0 };
      const result = converters.toSimpleCave(source);
      should(result.entrances).be.undefined();
    });
  });

  describe('toDocument()', () => {
    it('should handle missing importId fields', () => {
      const source = { id: 1 };
      const result = converters.toDocument(source);
      should(result.importId).be.undefined();
    });

    it('should prioritize idDbImport over importId', () => {
      const source = {
        id: 1,
        idDbImport: 'db123',
        importId: 'import456',
      };
      const result = converters.toDocument(source);
      should(result.importId).equal('db123');
    });

    it('should trim nameDbImport', () => {
      const source = {
        id: 1,
        nameDbImport: '  test  ',
      };
      const result = converters.toDocument(source);
      should(result.importSource).equal('test');
    });

    it('should handle creator fallback', () => {
      const source = {
        id: 1,
        creator: 'FallbackCreator',
      };
      const result = converters.toDocument(source);
      should(result.creator).equal('FallbackCreator');
    });

    it('should handle creatorComment fallback chain', () => {
      const source = {
        id: 1,
        authorComment: 'AuthorComment',
      };
      const result = converters.toDocument(source);
      should(result.creatorComment).equal('AuthorComment');
    });

    it('should handle mainLanguage from languages array', () => {
      const source = {
        id: 1,
        languages: [{ id: 'en' }, { id: 'fr' }],
      };
      const result = converters.toDocument(source);
      should(result.mainLanguage).equal('en');
    });

    it('should build iso3166 from countries and regions', () => {
      const source = {
        id: 1,
        countries: [{ id: 'FR', nativeName: 'France' }],
        isoRegions: [{ id: 'FR-75', name: 'Paris' }],
      };
      const result = converters.toDocument(source);
      should(result.iso3166).eql([
        { iso: 'FR', name: 'France' },
        { iso: 'FR-75', name: 'Paris' },
      ]);
    });

    it('should include t_id for snapshots', () => {
      const source = {
        id: 1,
        t_id: 100,
      };
      const result = converters.toDocument(source);
      should(result.t_id).equal(100);
    });
  });

  describe('toEntrance()', () => {
    it('should hide coordinates for sensitive entrances without rights', () => {
      const source = {
        id: 1,
        isSensitive: true,
        latitude: 45.5,
        longitude: 6.5,
      };
      const result = converters.toEntrance(source, {
        hasCompleteViewRight: false,
      });
      should(result.latitude).be.null();
      should(result.longitude).be.null();
    });

    it('should show coordinates for sensitive entrances with rights', () => {
      const source = {
        id: 1,
        isSensitive: true,
        latitude: 45.5,
        longitude: 6.5,
      };
      const result = converters.toEntrance(source, {
        hasCompleteViewRight: true,
      });
      should(result.latitude).equal(45.5);
      should(result.longitude).equal(6.5);
    });

    it('should show coordinates for non-sensitive entrances', () => {
      const source = {
        id: 1,
        isSensitive: false,
        latitude: 45.5,
        longitude: 6.5,
      };
      const result = converters.toEntrance(source, {});
      should(result.latitude).equal(45.5);
      should(result.longitude).equal(6.5);
    });

    it('should handle is_sensitive field name', () => {
      const source = {
        id: 1,
        is_sensitive: true,
        latitude: 45.5,
        longitude: 6.5,
      };
      const result = converters.toEntrance(source, {});
      should(result.isSensitive).be.true();
      should(result.latitude).be.null();
    });

    it('should hide locations for sensitive entrances without rights', () => {
      const source = {
        id: 1,
        isSensitive: true,
        locations: [{ id: 1 }],
      };
      const result = converters.toEntrance(source, {
        hasCompleteViewRight: false,
      });
      should(result.locations).eql([]);
    });

    it('should include t_id for snapshots', () => {
      const source = {
        id: 1,
        t_id: 100,
      };
      const result = converters.toEntrance(source);
      should(result.t_id).equal(100);
    });

    it('should handle iso_3166_2 field name', () => {
      const source = {
        id: 1,
        iso_3166_2: 'FR-75',
      };
      const result = converters.toEntrance(source);
      should(result.iso3166).equal('FR-75');
    });

    it('should include dateLastModif from source in the result', () => {
      const source = {
        id: 1,
        isSensitive: false,
        dateLastModif: 1700000000000,
      };
      const result = converters.toEntrance(source);
      should(result.dateLastModif).equal(1700000000000);
    });

    it('should include isSensitiveLocked from source', () => {
      const result = converters.toEntrance({ id: 1, isSensitiveLocked: true });
      should(result.isSensitiveLocked).be.true();
    });

    it('should default isSensitiveLocked to false when absent (legacy rows)', () => {
      const result = converters.toEntrance({ id: 1 });
      should(result.isSensitiveLocked).be.false();
    });

    it('should read isSensitiveLocked from the snake_case column', () => {
      const result = converters.toEntrance({
        id: 1,
        is_sensitive_locked: true,
      });
      should(result.isSensitiveLocked).be.true();
    });
  });

  describe('toSimpleEntrance()', () => {
    it('should hide coordinates for sensitive entrances', () => {
      const source = {
        id: 1,
        isSensitive: true,
        latitude: 45.5,
        longitude: 6.5,
      };
      const result = converters.toSimpleEntrance(source, {});
      should(result.latitude).be.null();
      should(result.longitude).be.null();
    });

    it('should handle iso_3166_2 field name', () => {
      const source = {
        id: 1,
        iso_3166_2: 'FR-75',
      };
      const result = converters.toSimpleEntrance(source);
      should(result.iso3166).equal('FR-75');
    });
  });

  describe('toOrganization()', () => {
    it('should find main name from names array', () => {
      const source = {
        id: 1,
        names: [
          { id: 1, isMain: false, language: 'en' },
          { id: 2, isMain: true, language: 'fr' },
        ],
      };
      const result = converters.toOrganization(source);
      should(result.nameId).equal(2);
      should(result.language).equal('fr');
    });

    it('should handle missing names array', () => {
      const source = { id: 1 };
      const result = converters.toOrganization(source);
      should(result.nameId).be.undefined();
      should(result.language).be.undefined();
    });

    it('should handle iso_3166_2 field name', () => {
      const source = {
        id: 1,
        iso_3166_2: 'FR-75',
      };
      const result = converters.toOrganization(source);
      should(result.iso3166).equal('FR-75');
    });
  });

  describe('toSearchResult()', () => {
    it('should convert persons search results', () => {
      const source = {
        hits: [
          {
            collection: 'persons_123',
            document: { id: 1, nickname: 'Test' },
            highlight: {},
          },
        ],
        found: 1,
        out_of: 100,
        page: 1,
        request_params: { collection_name: 'persons' },
      };
      const result = converters.toSearchResult(source);
      // eslint-disable-next-line no-underscore-dangle
      should(result.results[0]._type).equal('persons');
      should(result.totalResults).equal(1);
    });

    it('should use default type from collection_name', () => {
      const source = {
        hits: [
          {
            document: { id: 1 },
            highlight: {},
          },
        ],
        found: 1,
        out_of: 100,
        page: 1,
        request_params: { collection_name: 'documents_123' },
      };
      const result = converters.toSearchResult(source);
      // eslint-disable-next-line no-underscore-dangle
      should(result.results[0]._type).equal('documents');
    });
  });

  describe('toDeletedEntity()', () => {
    it('should use title for documents', () => {
      const source = {
        id: 1,
        title: 'Document Title',
      };
      const result = converters.toDeletedEntity(source);
      should(result.name).equal('Document Title');
    });
  });

  describe('toSearchResult() edge cases', () => {
    it('should handle caves type', () => {
      const source = {
        hits: [
          {
            collection: 'caves_123',
            document: { id: 1 },
            highlight: {},
          },
        ],
        found: 1,
        out_of: 100,
        page: 1,
        request_params: { collection_name: 'caves' },
      };
      const result = converters.toSearchResult(source);
      // eslint-disable-next-line no-underscore-dangle
      should(result.results[0]._type).equal('caves');
    });

    it('should handle entrances type', () => {
      const source = {
        hits: [
          {
            collection: 'entrances_123',
            document: { id: 1 },
            highlight: {},
          },
        ],
        found: 1,
        out_of: 100,
        page: 1,
        request_params: { collection_name: 'entrances' },
      };
      const result = converters.toSearchResult(source);
      // eslint-disable-next-line no-underscore-dangle
      should(result.results[0]._type).equal('entrances');
    });

    it('should handle organizations type', () => {
      const source = {
        hits: [
          {
            collection: 'organizations_123',
            document: { id: 1 },
            highlight: {},
          },
        ],
        found: 1,
        out_of: 100,
        page: 1,
        request_params: { collection_name: 'organizations' },
      };
      const result = converters.toSearchResult(source);
      // eslint-disable-next-line no-underscore-dangle
      should(result.results[0]._type).equal('organizations');
    });

    it('should handle massifs type', () => {
      const source = {
        hits: [
          {
            collection: 'massifs_123',
            document: { id: 1 },
            highlight: {},
          },
        ],
        found: 1,
        out_of: 100,
        page: 1,
        request_params: { collection_name: 'massifs' },
      };
      const result = converters.toSearchResult(source);
      // eslint-disable-next-line no-underscore-dangle
      should(result.results[0]._type).equal('massifs');
    });
  });

  describe('toSubject()', () => {
    it('should trim subject code', () => {
      const source = {
        id: 'CODE123  ',
        subject: 'Test Subject',
      };
      const result = converters.toSubject(source);
      should(result.code).equal('CODE123');
    });

    it('should handle parent with full object', () => {
      const source = {
        id: 'CODE123',
        subject: 'Test',
        parent: { id: 'PARENT  ', subject: 'Parent Subject' },
      };
      const result = converters.toSubject(source);
      should(result.parent.code).equal('PARENT');
    });

    it('should handle parent without full object', () => {
      const source = {
        id: 'CODE123',
        subject: 'Test',
        parent: 'PARENT',
      };
      const result = converters.toSubject(source);
      should(result.parent).equal('PARENT');
    });
  });

  describe('toManagingOrganization()', () => {
    it('should map an active organization to {id, name, language}', () => {
      const result = converters.toManagingOrganization({
        id: 5,
        name: 'Speleo Club',
        language: 'fra',
      });
      should(result).eql({ id: 5, name: 'Speleo Club', language: 'fra' });
    });

    it('should null out missing name/language on an active organization', () => {
      const result = converters.toManagingOrganization({ id: 5 });
      should(result).eql({ id: 5, name: null, language: null });
    });

    it('should map a soft-deleted organization to a redirect stub', () => {
      const result = converters.toManagingOrganization({
        id: 7,
        isDeleted: true,
        redirectTo: 42,
        // name/language must be dropped for a deleted organization
        name: 'Should not appear',
        language: 'fra',
      });
      should(result).eql({ id: 7, isDeleted: true, redirectTo: 42 });
    });

    it('should default redirectTo to null when absent on a deleted organization', () => {
      const result = converters.toManagingOrganization({
        id: 7,
        isDeleted: true,
      });
      should(result).eql({ id: 7, isDeleted: true, redirectTo: null });
    });
  });

  describe('toMassif() organizations', () => {
    // Guards the filterDeleted:false path: soft-deleted managing organizations
    // must survive as redirect stubs (Requirement 6.3) rather than being
    // dropped by toList's default filtering, alongside active ones.
    it('should keep both active and soft-deleted organizations', () => {
      const result = converters.toMassif({
        id: 1,
        organizations: [
          { id: 5, name: 'Active Org', language: 'fra' },
          { id: 7, isDeleted: true, redirectTo: 42 },
        ],
      });
      should(result.organizations).eql([
        { id: 5, name: 'Active Org', language: 'fra' },
        { id: 7, isDeleted: true, redirectTo: 42 },
      ]);
    });

    it('should return an empty array when organizations is undefined', () => {
      const result = converters.toMassif({ id: 1 });
      should(result.organizations).eql([]);
    });

    it('should return an empty array when organizations is empty', () => {
      const result = converters.toMassif({ id: 1, organizations: [] });
      should(result.organizations).eql([]);
    });

    it('should include isSensitiveLocked, defaulting to false when absent', () => {
      should(converters.toMassif({ id: 1 }).isSensitiveLocked).be.false();
      should(
        converters.toMassif({ id: 1, isSensitiveLocked: true })
          .isSensitiveLocked
      ).be.true();
    });
  });
});
