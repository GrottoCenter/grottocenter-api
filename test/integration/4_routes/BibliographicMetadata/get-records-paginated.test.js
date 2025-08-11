const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

/**
 * Integration tests for the /api/v1/bibliographic-metadata/records-paginated endpoint
 * This tests:
 *   - basic pagination (limit, offset)
 *   - filtering by set, from, until parameters
 *   - includeDeleted parameter
 *   - response structure (records array, pagination metadata)
 */
describe('Bibliographic Metadata Get Records Paginated Controller', () => {
  let adminToken;

  before(async () => {
    // Mock timezone to UTC for consistent date handling
    process.env.TZ = 'UTC';
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  it('should return paginated records with default parameters', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records-paginated')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Check response structure
        res.body.should.have.property('records');
        res.body.should.have.property('pagination');
        res.body.should.have.property('parameters');

        // Check pagination metadata
        res.body.pagination.should.have.property('limit', 50);
        res.body.pagination.should.have.property('offset', 0);
        res.body.pagination.should.have.property('hasNext', false);

        // Check records array
        res.body.records.should.be.an.Array();
        res.body.records.length.should.equal(20);

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

  it('should respect limit parameter', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records-paginated?limit=5')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(5);
        res.body.pagination.should.have.property('limit', 5);
        res.body.pagination.should.have.property('hasNext', true);

        return done();
      });
  });

  it('should respect offset parameter', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records-paginated?limit=5&offset=5')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(5);
        res.body.pagination.should.have.property('limit', 5);
        res.body.pagination.should.have.property('offset', 5);
        res.body.pagination.should.have.property('hasNext', true);

        return done();
      });
  });

  it('should include deleted records when includeDeleted=true', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/records-paginated?includeDeleted=true'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(21);

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
      .get(
        '/api/v1/bibliographic-metadata/records-paginated?set=grottocenter:sound'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(5);

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
      .get('/api/v1/bibliographic-metadata/records-paginated?from=2025-01-10')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(12);

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
      .get('/api/v1/bibliographic-metadata/records-paginated?until=2025-01-05')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(4);

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
        '/api/v1/bibliographic-metadata/records-paginated?from=2025-01-03&until=2025-01-05'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(3);

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

  it('should combine pagination with filtering', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/records-paginated?set=grottocenter:sound&limit=3&offset=1'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.pagination.should.have.property('limit', 3);
        res.body.pagination.should.have.property('offset', 1);
        res.body.pagination.should.have.property('hasNext', true);
        res.body.records.length.should.equal(3);

        // All should have the sound set
        res.body.records.forEach((record) => {
          record.listSets.should.containEql('grottocenter:sound');
          record.should.have.property('dcTypeGrottocenter', 'sound');
        });

        return done();
      });
  });

  it('should return empty array when offset exceeds total', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records-paginated?offset=100')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(0);
        res.body.pagination.should.have.property('hasNext', false);

        return done();
      });
  });

  it('should handle invalid limit parameter gracefully', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records-paginated?limit=invalid')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Should default to 50
        res.body.pagination.should.have.property('limit', 50);
        res.body.records.length.should.equal(20); // All records

        return done();
      });
  });

  it('should include parameters in response', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/records-paginated?set=grottocenter:sound&from=2025-01-01&limit=10&offset=2'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.parameters.should.have.property('set', 'grottocenter:sound');
        res.body.parameters.should.have.property('from', '2025-01-01');
        res.body.parameters.should.have.property('limit', 10);
        res.body.parameters.should.have.property('offset', 2);

        return done();
      });
  });

  it('should validate complete record structure', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/records-paginated?limit=1')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(1);
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

  it('should filter by image set and validate record content', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/records-paginated?set=grottocenter:image&limit=2'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(2);

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
      .get(
        '/api/v1/bibliographic-metadata/records-paginated?set=grottocenter:collection'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(1);

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
        '/api/v1/bibliographic-metadata/records-paginated?set=grottocenter:collection&includeDeleted=true'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.records.length.should.equal(2);

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

  after(() => {
    // Restore original timezone
    delete process.env.TZ;
  });
});
