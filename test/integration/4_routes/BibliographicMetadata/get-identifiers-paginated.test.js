const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

/**
 * Integration tests for the /api/v1/bibliographic-metadata/identifiers-paginated endpoint
 * This tests:
 *   - basic pagination (limit, offset)
 *   - filtering by set, from, until parameters
 *   - includeDeleted parameter
 *   - response structure (identifiers array, pagination metadata)
 */
describe('Bibliographic Metadata Get Identifiers Paginated Controller', () => {
  let adminToken;

  before(async () => {
    // Mock timezone to UTC for consistent date handling
    process.env.TZ = 'UTC';
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  it('should return paginated identifiers with default parameters', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers-paginated')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Check response structure
        res.body.should.have.property('identifiers');
        res.body.should.have.property('pagination');
        res.body.should.have.property('parameters');

        // Check pagination metadata
        res.body.pagination.should.have.property('limit', 50);
        res.body.pagination.should.have.property('offset', 0);
        res.body.pagination.should.have.property('hasNext', false);

        // Check identifiers array
        res.body.identifiers.should.be.an.Array();
        res.body.identifiers.length.should.equal(20);

        // Check identifier structure (first identifier)
        const firstId = res.body.identifiers[0];
        firstId.should.have.property('oaiIdentifier');
        firstId.should.have.property('lastUpdate');
        firstId.should.have.property('listSets');
        firstId.listSets.should.be.an.Array();

        return done();
      });
  });

  it('should respect limit parameter', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers-paginated?limit=5')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.identifiers.length.should.equal(5);
        res.body.pagination.should.have.property('limit', 5);
        res.body.pagination.should.have.property('hasNext', true);

        return done();
      });
  });

  it('should respect offset parameter', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers-paginated?limit=5&offset=5'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.identifiers.length.should.equal(5);
        res.body.pagination.should.have.property('limit', 5);
        res.body.pagination.should.have.property('offset', 5);
        res.body.pagination.should.have.property('hasNext', true);

        return done();
      });
  });

  it('should include deleted records when includeDeleted=true', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers-paginated?includeDeleted=true'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

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
      .get(
        '/api/v1/bibliographic-metadata/identifiers-paginated?set=grottocenter:sound'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.identifiers.length.should.equal(5);

        // All returned identifiers should have the 'grottocenter:sound' set
        res.body.identifiers.forEach((identifier) => {
          identifier.listSets.should.containEql('grottocenter:sound');
        });

        return done();
      });
  });

  it('should filter by from parameter', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers-paginated?from=2025-01-10'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

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
      .get(
        '/api/v1/bibliographic-metadata/identifiers-paginated?until=2025-01-05'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

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
        '/api/v1/bibliographic-metadata/identifiers-paginated?from=2025-01-03&until=2025-01-05'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

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

  it('should combine pagination with filtering', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers-paginated?set=grottocenter:sound&limit=3&offset=1'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.pagination.should.have.property('limit', 3);
        res.body.pagination.should.have.property('offset', 1);
        res.body.pagination.should.have.property('hasNext', true);
        res.body.identifiers.length.should.equal(3);

        // All should have the sound set
        res.body.identifiers.forEach((identifier) => {
          identifier.listSets.should.containEql('grottocenter:sound');
        });

        return done();
      });
  });

  it('should return empty array when offset exceeds total', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers-paginated?offset=100')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.body.identifiers.length.should.equal(0);
        res.body.pagination.should.have.property('hasNext', false);

        return done();
      });
  });

  it('should handle invalid limit parameter gracefully', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/identifiers-paginated?limit=invalid')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Should default to 50
        res.body.pagination.should.have.property('limit', 50);
        res.body.identifiers.length.should.equal(20); // All records

        return done();
      });
  });

  it('should include parameters in response', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/identifiers-paginated?set=grottocenter:sound&from=2025-01-01&limit=10&offset=2'
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

  after(() => {
    // Restore original timezone
    delete process.env.TZ;
  });
});
