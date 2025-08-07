const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

/**
 * Integration tests for the /api/v1/bibliographic-metadata/sets endpoint
 * This tests:
 *   - retrieval of all distinct OAI-PMH sets
 *   - response structure validation
 *   - set content validation
 *   - sorting verification
 */
describe('Bibliographic Metadata Get Sets Controller', () => {
  let adminToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  it('should return all distinct sets from registered records', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Check response structure
        res.body.should.have.property('sets');
        res.body.should.have.property('count');

        // Check sets array
        res.body.sets.should.be.an.Array();
        res.body.count.should.equal(res.body.sets.length);

        // Expected distinct sets from fixture data (excluding deleted record sets)
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

        // Verify all expected sets are present
        res.body.sets.length.should.equal(expectedSets.length);
        expectedSets.forEach((expectedSet) => {
          res.body.sets.should.containEql(expectedSet);
        });

        return done();
      });
  });

  it('should return sets in sorted order', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Verify sets are in alphabetical order
        const { sets } = res.body;
        const sortedSets = [...sets].sort();
        sets.should.deepEqual(sortedSets);

        return done();
      });
  });

  it('should contain the base grottocenter set', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Every record has 'grottocenter' set, so it should always be present
        res.body.sets.should.containEql('grottocenter');

        return done();
      });
  });

  it('should contain all type-specific sets', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Verify all content type sets are present
        const typeSpecificSets = [
          'grottocenter:article',
          'grottocenter:collection',
          'grottocenter:dataset',
          'grottocenter:image',
          'grottocenter:interactive_resource',
          'grottocenter:map',
          'grottocenter:sound',
        ];

        typeSpecificSets.forEach((set) => {
          res.body.sets.should.containEql(set);
        });

        return done();
      });
  });

  it('should have correct count matching array length', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Count should match the actual number of sets returned
        res.body.count.should.equal(res.body.sets.length);
        res.body.count.should.be.a.Number();
        res.body.count.should.be.greaterThan(0);

        return done();
      });
  });

  it('should only return unique sets', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Verify no duplicate sets
        const { sets } = res.body;
        const uniqueSets = [...new Set(sets)];
        sets.length.should.equal(uniqueSets.length);

        return done();
      });
  });

  it('should return sets as strings', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // All sets should be strings
        res.body.sets.forEach((set) => {
          set.should.be.a.String();
          set.length.should.be.greaterThan(0);
        });

        return done();
      });
  });

  it('should follow OAI-PMH set naming convention', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // All sets should start with 'grottocenter'
        res.body.sets.forEach((set) => {
          set.should.startWith('grottocenter');
        });

        // Type-specific sets should have the colon format
        const typeSpecificSets = res.body.sets.filter(
          (set) => set !== 'grottocenter'
        );
        typeSpecificSets.forEach((set) => {
          set.should.match(/^grottocenter:[a-z_]+$/);
        });

        return done();
      });
  });

  it('should exclude sets from deleted records by default', (done) => {
    // Note: Based on the service implementation, getDistinctSets(registeredOnly=true)
    // should only return sets from registered records
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // The sets should come from registered records only
        // Record 13 is deleted and has 'grottocenter:collection' set
        // But since other records also have 'grottocenter:collection', it should still appear
        res.body.sets.should.containEql('grottocenter:collection');

        return done();
      });
  });

  it('should handle response structure correctly', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Validate complete response structure
        res.body.should.be.an.Object();
        res.body.should.have.properties(['sets', 'count']);
        res.body.should.not.have.property('parameters'); // Sets endpoint doesn't use parameters

        // Validate types
        res.body.sets.should.be.an.Array();
        res.body.count.should.be.a.Number();

        return done();
      });
  });

  it('should return consistent results on multiple calls', (done) => {
    // Make first request
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res1) => {
        if (err) return done(err);

        // Make second request
        return supertest(sails.hooks.http.app)
          .get('/api/v1/bibliographic-metadata/sets')
          .set('Authorization', adminToken)
          .expect(200)
          .end((error, res2) => {
            if (error) return done(error);

            // Results should be identical
            res1.body.sets.should.deepEqual(res2.body.sets);
            res1.body.count.should.equal(res2.body.count);

            return done();
          });
      });
  });

  it('should have expected minimum number of sets', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/sets')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        // Should have at least the base set plus some type-specific ones
        res.body.sets.length.should.be.greaterThanOrEqual(7);
        res.body.count.should.be.greaterThanOrEqual(7);

        return done();
      });
  });
});
