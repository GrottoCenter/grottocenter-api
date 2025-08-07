const supertest = require('supertest');
const AuthTokenService = require('../../AuthTokenService');

/**
 * Integration tests for the /api/v1/bibliographic-metadata/count endpoint
 * This tests filtering by:
 *   - default (registered only)
 *   - includeDeleted=true
 *   - set
 *   - date range (from, until)
 */
describe('Bibliographic Metadata Count Controller', () => {
  let adminToken;

  before(async () => {
    adminToken = await AuthTokenService.getRawBearerAdminToken();
  });

  it('should return the total count of registered records by default', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/count')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('count', 20); // Excludes id 13 (deleted)
        res.body.should.have.property('parameters');
        return done();
      });
  });

  it('should return the count including deleted records when includeDeleted=true', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/count?includeDeleted=true')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('count', 21);
        return done();
      });
  });

  it("should return count filtered by set 'grottocenter:sound'", (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/count?set=grottocenter:sound')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('count', 5); // ids: 1, 4, 14, 15, 17
        return done();
      });
  });

  it('should return count filtered by from=2025-01-10', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/count?from=2025-01-10')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('count', 11); // ids 10 to 21 (except 13)
        return done();
      });
  });

  it('should return count filtered by until=2025-01-05', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/count?until=2025-01-05')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('count', 5);
        return done();
      });
  });

  it('should return count filtered by from and until', (done) => {
    supertest(sails.hooks.http.app)
      .get(
        '/api/v1/bibliographic-metadata/count?from=2025-01-03&until=2025-01-05'
      )
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('count', 3); // ids: 2, 3, 4
        return done();
      });
  });

  it('should return 0 for deleted set if includeDeleted=false (e.g. article)', (done) => {
    supertest(sails.hooks.http.app)
      .get('/api/v1/bibliographic-metadata/count?set=grottocenter:article')
      .set('Authorization', adminToken)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        res.body.should.have.property('count', 1); // id 12 is registered, 13 is deleted
        return done();
      });
  });
});
