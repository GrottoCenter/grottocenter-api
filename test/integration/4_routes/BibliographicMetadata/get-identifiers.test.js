const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

/**
 * Integration tests for the /api/v1/bibliographic-metadata/identifiers endpoint
 * This tests:
 *   - basic identifier retrieval (all registered records)
 *   - filtering by set, from, until parameters
 *   - includeDeleted parameter
 *   - response structure (identifiers array, count)
 */
describe('Bibliographic Metadata Get Identifiers Controller', () => {
  let adminToken;

  before(async () => {
    // Mock timezone to UTC for consistent date handling
    process.env.TZ = 'UTC';
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  it('should return all registered identifiers by default', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Check response structure
        res.body.should.have.property('identifiers');
        res.body.should.have.property('count');
        res.body.should.have.property('parameters');

        // Check identifiers array and count
        res.body.identifiers.should.be.an.Array();
        res.body.identifiers.length.should.equal(20); // Excludes id 13 (deleted)
        res.body.count.should.equal(20);

        // Check identifier structure (first identifier)
        const firstId = res.body.identifiers[0];
        firstId.should.have.property('oaiIdentifier');
        firstId.should.have.property('lastUpdate');
        firstId.should.have.property('listSets');
        firstId.listSets.should.be.an.Array();

        return done();
      });
  });

  it('should include deleted records when includeDeleted=true', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers?includeDeleted=true')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(21);
        res.body.identifiers.length.should.equal(21);

        // Should include the deleted record (id 13)
        const deletedRecord = res.body.identifiers.find(
          (id) => id.oaiIdentifier === 'oai:grottocenter.org:13'
        );
        deletedRecord.should.not.be.undefined();

        return done();
      });
  });

  it("should filter by set 'grottocenter:sound'", (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers?set=grottocenter:sound')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(5); // ids: 1, 4, 14, 15, 17
        res.body.identifiers.length.should.equal(5);

        // All returned identifiers should have the 'grottocenter:sound' set
        res.body.identifiers.forEach((identifier) => {
          identifier.listSets.should.containEql('grottocenter:sound');
        });

        return done();
      });
  });

  it("should filter by set 'grottocenter:image'", (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers?set=grottocenter:image')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(4); // ids: 2, 8, 9, 18
        res.body.identifiers.length.should.equal(4);

        // All returned identifiers should have the 'grottocenter:image' set
        res.body.identifiers.forEach((identifier) => {
          identifier.listSets.should.containEql('grottocenter:image');
        });

        return done();
      });
  });

  it('should filter by from parameter', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers?from=2025-01-10')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(12); // actual count from CI
        res.body.identifiers.length.should.equal(12);

        // All returned identifiers should have lastUpdate >= 2025-01-10
        res.body.identifiers.forEach((identifier) => {
          const lastUpdate = new Date(identifier.lastUpdate);
          const fromDate = new Date('2025-01-10');
          fromDate.setUTCHours(0, 0, 0, 0);
          lastUpdate.should.be.greaterThanOrEqual(fromDate);
        });

        return done();
      });
  });

  it('should filter by until parameter', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers?until=2025-01-05')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(4); // actual count from CI
        res.body.identifiers.length.should.equal(4);

        // All returned identifiers should have lastUpdate <= 2025-01-05 23:59:59.999
        res.body.identifiers.forEach((identifier) => {
          const lastUpdate = new Date(identifier.lastUpdate);
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
        '/api/v1/bibliographic-metadata/identifiers?from=2025-01-03&until=2025-01-05'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(3); // ids: 2, 3, 4
        res.body.identifiers.length.should.equal(3);

        // All returned identifiers should be within the date range
        res.body.identifiers.forEach((identifier) => {
          const lastUpdate = new Date(identifier.lastUpdate);
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

  it('should combine set and date filters', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers?set=grottocenter:sound&from=2025-01-14'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(3); // ids: 14, 15, 17 (sound records from 2025-01-14 onwards)
        res.body.identifiers.length.should.equal(3);

        // All should have the sound set and be >= 2025-01-14
        res.body.identifiers.forEach((identifier) => {
          identifier.listSets.should.containEql('grottocenter:sound');

          const lastUpdate = new Date(identifier.lastUpdate);
          const fromDate = new Date('2025-01-14');
          fromDate.setUTCHours(0, 0, 0, 0);
          lastUpdate.should.be.greaterThanOrEqual(fromDate);
        });

        return done();
      });
  });

  it('should return empty array for non-existent set', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers?set=nonexistent:set')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(0);
        res.body.identifiers.length.should.equal(0);
        res.body.identifiers.should.be.an.Array();

        return done();
      });
  });

  it('should return empty array for date range with no matches', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers?from=2030-01-01')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(0);
        res.body.identifiers.length.should.equal(0);
        res.body.identifiers.should.be.an.Array();

        return done();
      });
  });

  it('should include parameters in response', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers?set=grottocenter:sound&from=2025-01-01&until=2025-01-15'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.parameters.should.have.property('set', 'grottocenter:sound');
        res.body.parameters.should.have.property('from', '2025-01-01');
        res.body.parameters.should.have.property('until', '2025-01-15');

        return done();
      });
  });

  it('should handle missing parameters gracefully', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers?from=&until=&set=')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Should behave like no filters (return all registered records)
        res.body.count.should.equal(20);
        res.body.identifiers.length.should.equal(20);

        return done();
      });
  });

  it('should verify identifier structure and content', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers?set=grottocenter:sound&from=2025-01-01&until=2025-01-02'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(1); // Only id 1 matches
        res.body.identifiers.length.should.equal(1);

        const identifier = res.body.identifiers[0];
        identifier.should.have.property(
          'oaiIdentifier',
          'oai:grottocenter.org:1'
        );
        identifier.should.have.property('lastUpdate');
        identifier.should.have.property('listSets');
        identifier.listSets.should.containEql('grottocenter');
        identifier.listSets.should.containEql('grottocenter:sound');

        return done();
      });
  });

  it('should return correct count for collection set', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers?set=grottocenter:collection'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(1); // Only id 7 is registered with collection set (id 13 is deleted)
        res.body.identifiers.length.should.equal(1);

        const identifier = res.body.identifiers[0];
        identifier.oaiIdentifier.should.equal('oai:grottocenter.org:7');
        identifier.listSets.should.containEql('grottocenter:collection');

        return done();
      });
  });

  it('should include deleted collection when includeDeleted=true', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers?set=grottocenter:collection&includeDeleted=true'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.count.should.equal(2); // ids 7 and 13
        res.body.identifiers.length.should.equal(2);

        const identifiers = res.body.identifiers
          .map((id) => id.oaiIdentifier)
          .sort();
        // Identifiers should be in sorted order
        identifiers.should.eql([
          'oai:grottocenter.org:13',
          'oai:grottocenter.org:7',
        ]);

        return done();
      });
  });

  after(() => {
    // Restore original timezone
    delete process.env.TZ;
  });
});
