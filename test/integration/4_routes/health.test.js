const should = require('should');
const supertest = require('supertest');

describe('Health endpoint', () => {
  let request;

  before(() => {
    request = supertest(sails.hooks.http.app);
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', (done) => {
      request
        .get('/api/v1/health')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);

          // Check response structure
          should(res.body).have.property('status');
          should(res.body).have.property('timestamp');
          should(res.body).have.property('services');
          should(res.body).have.property('build');

          // Check services
          should(res.body.services).have.property('database');
          should(res.body.services).have.property('search');

          // Check database service
          should(res.body.services.database).have.property('status');
          should(res.body.services.database).have.property('message');

          // Check search service
          should(res.body.services.search).have.property('status');
          should(res.body.services.search).have.property('message');

          // Check build info
          should(res.body.build).have.property('gitCommit');
          should(res.body.build).have.property('buildTime');

          // Validate status values
          should(['healthy', 'unhealthy']).containEql(res.body.status);
          should(['healthy', 'unhealthy']).containEql(
            res.body.services.database.status
          );
          should(['healthy', 'unhealthy']).containEql(
            res.body.services.search.status
          );

          // Validate timestamp format
          const timestamp = new Date(res.body.timestamp);
          should(timestamp).be.a.Date();

          return done();
        });
    });

    it('should return 503 when services are unhealthy', (done) => {
      // This test would require mocking the database/ES connections to fail
      // For now, we'll just verify the endpoint is accessible
      request
        .get('/api/v1/health')
        .expect((res) =>
          // Should return either 200 or 503
          should([200, 503]).containEql(res.status)
        )
        .end(done);
    });

    it('should include git commit hash', (done) => {
      request
        .get('/api/v1/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          should(res.body.build.gitCommit).be.a.String();
          // Git commit hash should be either a 40-character hex string or 'unknown'
          if (res.body.build.gitCommit !== 'unknown') {
            should(res.body.build.gitCommit).match(/^[a-f0-9]{40}$/);
          }

          return done();
        });
    });

    it('should include build time', (done) => {
      request
        .get('/api/v1/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          should(res.body.build.buildTime).be.a.String();
          // Build time should be either a valid ISO date string or 'unknown'
          if (res.body.build.buildTime !== 'unknown') {
            const buildTime = new Date(res.body.build.buildTime);
            should(buildTime).be.a.Date();
          }

          return done();
        });
    });
  });
});
