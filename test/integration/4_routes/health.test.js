const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');

const HEALTHY_DB = 'Database connection successful';
const HEALTHY_SEARCH = 'Search connection successful';

describe('Health endpoint', () => {
  let request;
  let SearchService;
  let sendNativeQuery;
  let isAlive;
  let originalTimeoutMs;

  before(() => {
    request = supertest(sails.hooks.http.app);
    // Resolve after the lift: a top-level require would be a stale copy.
    // eslint-disable-next-line global-require
    SearchService = require('../../../api/services/SearchService');
    originalTimeoutMs = sails.config.custom.healthCheckTimeoutMs;
  });

  beforeEach(() => {
    // Both dependencies are healthy unless a test says otherwise; CI has no
    // Typesense, so the real search check would always fail there.
    sendNativeQuery = sinon
      .stub(sails.getDatastore(), 'sendNativeQuery')
      .resolves({ rows: [{ '?column?': 1 }] });
    isAlive = sinon.stub(SearchService, 'isAlive').resolves(true);
  });

  afterEach(() => {
    sinon.restore();
    sails.config.custom.healthCheckTimeoutMs = originalTimeoutMs;
  });

  const assertBothChecksRan = () => {
    should(sendNativeQuery.calledOnceWith('SELECT 1')).be.true();
    should(isAlive.calledOnce).be.true();
  };

  describe('GET /api/v1/health', () => {
    it('returns 200 and a healthy report when every dependency is healthy', async () => {
      const res = await request
        .get('/api/v1/health')
        .expect(200)
        .expect('Content-Type', /json/);

      assertBothChecksRan();
      should(res.body.status).equal('healthy');
      should(res.body.services).deepEqual({
        database: { status: 'healthy', message: HEALTHY_DB },
        search: { status: 'healthy', message: HEALTHY_SEARCH },
      });
      should(Number.isNaN(Date.parse(res.body.timestamp))).be.false();
      should(res.body.build).have.properties(['gitCommit', 'buildTime']);
    });

    it('returns 503 with a generic message when the database query fails', async () => {
      sendNativeQuery.rejects(new Error('connect ECONNREFUSED 10.0.0.5:5432'));

      const res = await request.get('/api/v1/health').expect(503);

      assertBothChecksRan();
      should(res.body.status).equal('unhealthy');
      should(res.body.services).deepEqual({
        database: {
          status: 'unhealthy',
          message: 'Database connection failed',
        },
        search: { status: 'healthy', message: HEALTHY_SEARCH },
      });
      should(JSON.stringify(res.body)).not.containEql('ECONNREFUSED');
    });

    it('returns 503 when search reports it is not alive', async () => {
      isAlive.resolves(false);

      const res = await request.get('/api/v1/health').expect(503);

      assertBothChecksRan();
      should(res.body.status).equal('unhealthy');
      should(res.body.services).deepEqual({
        database: { status: 'healthy', message: HEALTHY_DB },
        search: { status: 'unhealthy', message: 'Search connection failed' },
      });
    });

    it('returns 503 with a generic message when the search check throws', async () => {
      isAlive.rejects(new Error('getaddrinfo ENOTFOUND search.internal'));

      const res = await request.get('/api/v1/health').expect(503);

      assertBothChecksRan();
      should(res.body.services.search).deepEqual({
        status: 'unhealthy',
        message: 'Search connection failed',
      });
      should(JSON.stringify(res.body)).not.containEql('ENOTFOUND');
    });

    it('returns 503 when both dependencies fail', async () => {
      sendNativeQuery.rejects(new Error('db down'));
      isAlive.rejects(new Error('search down'));

      const res = await request.get('/api/v1/health').expect(503);

      should(res.body.status).equal('unhealthy');
      should(res.body.services.database.status).equal('unhealthy');
      should(res.body.services.search.status).equal('unhealthy');
    });

    it('returns 503 with a timeout message when the database query hangs', async () => {
      sails.config.custom.healthCheckTimeoutMs = 50;
      sendNativeQuery.returns(new Promise(() => {}));

      const res = await request.get('/api/v1/health').expect(503);

      should(res.body.services).deepEqual({
        database: { status: 'unhealthy', message: 'Database check timed out' },
        search: { status: 'healthy', message: HEALTHY_SEARCH },
      });
    });

    it('returns 503 with a timeout message when the search check hangs', async () => {
      sails.config.custom.healthCheckTimeoutMs = 50;
      isAlive.returns(new Promise(() => {}));

      const res = await request.get('/api/v1/health').expect(503);

      should(res.body.services).deepEqual({
        database: { status: 'healthy', message: HEALTHY_DB },
        search: { status: 'unhealthy', message: 'Search check timed out' },
      });
    });

    it('still reports build info when unhealthy', async () => {
      isAlive.resolves(false);

      const res = await request.get('/api/v1/health').expect(503);

      should(res.body.build).have.properties(['gitCommit', 'buildTime']);
    });

    it('returns a 40-character hex git commit or "unknown"', async () => {
      const res = await request.get('/api/v1/health').expect(200);

      should(res.body.build.gitCommit).match(/^([a-f0-9]{40}|unknown)$/);
    });

    it('returns a parseable build time or "unknown"', async () => {
      const res = await request.get('/api/v1/health').expect(200);

      const { buildTime } = res.body.build;
      should(
        buildTime === 'unknown' || !Number.isNaN(Date.parse(buildTime))
      ).be.true();
    });

    it('reports a generic error without the file path when build-info.json is missing', async () => {
      const fs = require('fs'); // eslint-disable-line global-require
      const enoent = Object.assign(
        new Error(
          "ENOENT: no such file or directory, open '/srv/app/build-info.json'"
        ),
        { code: 'ENOENT' }
      );
      sinon
        .stub(fs, 'readFileSync')
        .callThrough()
        .withArgs(sinon.match(/build-info\.json$/))
        .throws(enoent);

      const res = await request.get('/api/v1/health').expect(200);

      should(res.body.build).deepEqual({
        gitCommit: 'unknown',
        buildTime: 'unknown',
        error: 'Failed to read build info',
      });
    });
  });
});
