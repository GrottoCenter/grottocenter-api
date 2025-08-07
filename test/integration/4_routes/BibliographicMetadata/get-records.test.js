const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

/**
 * Integration tests for the /api/v1/bibliographic-metadata/records endpoint
 * This tests:
 *   - basic record retrieval without pagination
 *   - filtering by set, from, until parameters
 *   - includeDeleted parameter
 *   - response structure (records array, count, parameters)
 */
describe('Bibliographic Metadata Get Records Controller', () => {
  let adminToken;

  before(async () => {
    // Mock timezone to UTC for consistent date handling
    process.env.TZ = 'UTC';
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  it('should return all records with default parameters', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Check response structure
        res.body.should.have.property('records');
        res.body.should.have.property('count');
        res.body.should.have.property('parameters');

        // Check records array
        res.body.records.should.be.an.Array();
        res.body.records.length.should.equal(20); // Excludes id 13 (deleted)
        res.body.count.should.equal(20);

        // Check record structure (first record) - full bibliographic record
        const firstRecord = res.body.records[0];
        firstRecord.should.have.property('id');
        firstRecord.should.have.property('oaiIdentifier');
        firstRecord.should.have.property('lastUpdate');
        firstRecord.should.have.property('listSets');
        firstRecord.should.have.property('dcTitle');
        firstRecord.should.have.property('dcCreators');
        firstRecord.should.have.property('dcPublisher');
        firstRecord.should.have.property('dcDate');
        firstRecord.should.have.property('dcLanguages');
        firstRecord.should.have.property('dcDescriptions');
        firstRecord.should.have.property('dcCoverages');
        firstRecord.should.have.property('dcSubjects');
        firstRecord.should.have.property('dcFormats');
        firstRecord.should.have.property('dcIdentifiers');
        firstRecord.should.have.property('dcRelations');
        firstRecord.should.have.property('dcSources');
        firstRecord.should.have.property('dcRights');
        firstRecord.should.have.property('dcTypeGrottocenter');
        firstRecord.should.have.property('dcTypeDcmi');
        firstRecord.should.have.property('metadataStatus');
        firstRecord.should.have.property('children');
        firstRecord.listSets.should.be.an.Array();

        return done();
      });
  });

  it('should include deleted records when includeDeleted=true', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?includeDeleted=true')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(21);
        res.body.count.should.equal(21);

        // Should include the deleted record (id 13)
        const deletedRecord = res.body.records.find(
          (record) => record.id === 13
        );
        deletedRecord.should.not.be.undefined();
        deletedRecord.should.have.property('metadataStatus', 'deleted');

        return done();
      });
  });

  it("should filter by set 'grottocenter:sound'", (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?set=grottocenter:sound')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(5); // ids: 1, 4, 14, 15, 17
        res.body.count.should.equal(5);

        // All returned records should have the 'grottocenter:sound' set
        res.body.records.forEach((record) => {
          record.listSets.should.containEql('grottocenter:sound');
          record.should.have.property('dcTypeGrottocenter', 'sound');
        });

        return done();
      });
  });

  it('should filter by from parameter', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?from=2025-01-10')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(12); // actual count from CI
        res.body.count.should.equal(12);

        // All returned records should have lastUpdate >= 2025-01-10
        res.body.records.forEach((record) => {
          const lastUpdate = new Date(record.lastUpdate);
          const fromDate = new Date('2025-01-10');
          fromDate.setUTCHours(0, 0, 0, 0);
          lastUpdate.should.be.greaterThanOrEqual(fromDate);
        });

        return done();
      });
  });

  it('should filter by until parameter', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?until=2025-01-05')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(4); // actual count from CI
        res.body.count.should.equal(4);

        // All returned records should have lastUpdate <= 2025-01-05 23:59:59.999
        res.body.records.forEach((record) => {
          const lastUpdate = new Date(record.lastUpdate);
          const untilDate = new Date('2025-01-05');
          untilDate.setUTCHours(23, 59, 59, 999);
          lastUpdate.should.be.lessThanOrEqual(untilDate);
        });

        return done();
      });
  });

  it('should filter by from and until parameters', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/records?from=2025-01-03&until=2025-01-05'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(3); // ids: 3, 4, 5 (id 2 is 2025-01-02)
        res.body.count.should.equal(3);

        // All returned records should be within the date range
        res.body.records.forEach((record) => {
          const lastUpdate = new Date(record.lastUpdate);
          const fromDate = new Date('2025-01-03');
          fromDate.setUTCHours(0, 0, 0, 0);
          const untilDate = new Date('2025-01-05');
          untilDate.setUTCHours(23, 59, 59, 999);

          lastUpdate.should.be.greaterThanOrEqual(fromDate);
          lastUpdate.should.be.lessThanOrEqual(untilDate);
        });

        return done();
      });
  });

  it('should include parameters in response', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/records?set=grottocenter:sound&from=2025-01-01'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.parameters.should.have.property('set', 'grottocenter:sound');
        res.body.parameters.should.have.property('from', '2025-01-01');

        return done();
      });
  });

  it('should validate complete record structure', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?set=grottocenter:image')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.be.greaterThan(0);
        const record = res.body.records[0];

        // Validate all Dublin Core fields are present
        record.should.have.property('id');
        record.should.have.property('oaiIdentifier');
        record.should.have.property('lastUpdate');
        record.should.have.property('metadataStatus', 'registered');
        record.should.have.property('listSets');
        record.should.have.property('dcTitle');
        record.should.have.property('dcCreators');
        record.should.have.property('dcContributor');
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
        record.should.have.property('hasBeenUpdated');
        record.should.have.property('children');

        // Validate array fields are arrays
        record.listSets.should.be.an.Array();
        record.dcCreators.should.be.an.Array();
        record.dcLanguages.should.be.an.Array();
        record.dcDescriptions.should.be.an.Array();
        record.dcCoverages.should.be.an.Array();
        record.dcSubjects.should.be.an.Array();
        record.dcFormats.should.be.an.Array();
        record.dcIdentifiers.should.be.an.Array();
        record.dcRelations.should.be.an.Array();
        record.dcSources.should.be.an.Array();
        record.dcRights.should.be.an.Array();
        record.children.should.be.an.Array();

        return done();
      });
  });

  it("should filter by set 'grottocenter:image'", (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?set=grottocenter:image')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(4); // ids: 2, 8, 9, 18
        res.body.count.should.equal(4);

        // Validate each record has image set and correct type
        res.body.records.forEach((record) => {
          record.listSets.should.containEql('grottocenter:image');
          record.should.have.property('dcTypeGrottocenter', 'image');
          record.should.have.property('dcTypeDcmi', 'image');
          record.should.have.property('metadataStatus', 'registered');
        });

        return done();
      });
  });

  it('should handle collection set with deleted records when includeDeleted=false', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?set=grottocenter:collection')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(1); // Only id 7 is registered (id 13 is deleted)
        res.body.count.should.equal(1);

        const record = res.body.records[0];
        record.should.have.property('id', 7);
        record.should.have.property('dcTypeGrottocenter', 'collection');
        record.should.have.property('metadataStatus', 'registered');
        record.listSets.should.containEql('grottocenter:collection');

        return done();
      });
  });

  it('should include collection set with deleted records when includeDeleted=true', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/records?set=grottocenter:collection&includeDeleted=true'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(2); // ids 7 and 13
        res.body.count.should.equal(2);

        // Find both records
        const registeredRecord = res.body.records.find((r) => r.id === 7);
        const deletedRecord = res.body.records.find((r) => r.id === 13);

        registeredRecord.should.not.be.undefined();
        registeredRecord.should.have.property('metadataStatus', 'registered');

        deletedRecord.should.not.be.undefined();
        deletedRecord.should.have.property('metadataStatus', 'deleted');

        // Both should have collection set
        [registeredRecord, deletedRecord].forEach((record) => {
          record.listSets.should.containEql('grottocenter:collection');
          record.should.have.property('dcTypeGrottocenter', 'collection');
        });

        return done();
      });
  });

  it("should filter by set 'grottocenter:dataset'", (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?set=grottocenter:dataset')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(2); // ids: 11, 12
        res.body.count.should.equal(2);

        // All returned records should have the 'grottocenter:dataset' set
        res.body.records.forEach((record) => {
          record.listSets.should.containEql('grottocenter:dataset');
          record.should.have.property('dcTypeGrottocenter', 'dataset');
          record.should.have.property('dcTypeDcmi', 'dataset');
        });

        return done();
      });
  });

  it('should return records with specific Dublin Core content', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?set=grottocenter:map')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(2); // ids: 6, 10
        res.body.count.should.equal(2);

        // Find record 6 which has rich metadata
        const record6 = res.body.records.find((r) => r.id === 6);
        record6.should.not.be.undefined();

        // Check specific DC metadata content for record 6
        record6.should.have.property('dcTitle', 'Document 6 on map');
        record6.dcCreators.should.be.an.Array();
        record6.dcCreators.should.containEql('Author 6A');
        record6.dcCreators.should.containEql('Author 6B');
        record6.should.have.property('dcContributor', 'Contributor 6');
        record6.should.have.property('dcPublisher', 'Publisher 6');
        record6.dcLanguages.should.containEql('fre');
        record6.dcDescriptions.should.containEql(
          'This is a description of document 6.'
        );
        record6.dcCoverages.should.containEql('FR-XXX');
        record6.dcCoverages.should.containEql('FRA');
        record6.dcSubjects.should.containEql('Subject 2');
        record6.dcSubjects.should.containEql('Subject 8');
        record6.dcFormats.should.containEql('pdf');
        record6.dcFormats.should.containEql('jpg');
        record6.dcIdentifiers.should.containEql('doi:10.1000/gc6');
        record6.dcIdentifiers.should.containEql(
          'url:https://grottocenter.org/doc/6.pdf'
        );
        record6.dcSources.should.containEql(
          'Bulletin Bibliographique Spéléologique / Speleo Abstracts'
        );
        record6.dcRights.should.containEql('CC0');
        record6.should.have.property('dcTypeGrottocenter', 'map');
        record6.should.have.property('dcTypeDcmi', 'image');

        return done();
      });
  });

  it('should return records with children relationships', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/records?set=grottocenter:interactive_resource'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(5); // ids: 3, 5, 10, 16, 19
        res.body.count.should.equal(5);

        // Find record 3 which has children
        const record3 = res.body.records.find((r) => r.id === 3);
        record3.should.not.be.undefined();
        record3.should.have.property(
          'dcTypeGrottocenter',
          'interactive_resource'
        );
        record3.children.should.be.an.Array();
        record3.children.should.containEql(4);

        return done();
      });
  });

  it('should handle empty result set gracefully', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?set=nonexistent:set')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.should.be.an.Array();
        res.body.records.length.should.equal(0);
        res.body.count.should.equal(0);
        res.body.parameters.should.have.property('set', 'nonexistent:set');

        return done();
      });
  });

  it('should handle invalid date parameters gracefully', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records?from=invalid-date')
      .set('Authorization', adminToken)
      .expect(500) // Should return server error for invalid date
      .end((err, res) => {
        if (err) return done(err);

        res.body.should.have.property('message');
        // The actual error message is generic, so just check it exists
        res.body.message.should.be.a.String();

        return done();
      });
  });

  after(() => {
    // Restore original timezone
    delete process.env.TZ;
  });
});
