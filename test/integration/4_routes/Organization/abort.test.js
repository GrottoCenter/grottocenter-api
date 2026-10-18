const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');
const guardPgPool = require('../../../../api/utils/guardPgPool');

// Passed as a parameter, so the polling queries never match themselves.
const MARKER = 'abort-1849';
const SLOW_QUERY = `SELECT pg_sleep(30) /* ${MARKER} */`;

const activeSlowQueries = async () => {
  const { rows } = await sails.sendNativeQuery(
    `SELECT pid FROM pg_stat_activity
      WHERE state = 'active' AND query LIKE '%' || $1 || '%'
        AND pid <> pg_backend_pid()`,
    [MARKER]
  );
  return rows.length;
};

const waitFor = async (predicate, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    if (await predicate()) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }
  return false;
};

// #1849: a client that gives up must not leave its query running.
describe('Client-aborted request', () => {
  let GrottoService;
  let stub;

  before(() => {
    // config/bootstrap.js, which installs the guard, does not run in tests.
    guardPgPool(sails.getDatastore().manager.pool, sails.log);
    // eslint-disable-next-line global-require
    GrottoService = require('../../../../api/services/GrottoService');
  });

  afterEach(async () => {
    if (stub) stub.restore();
    // Never leave a sleeping backend behind for the next tests.
    await sails.sendNativeQuery(
      `SELECT pg_cancel_backend(pid) FROM pg_stat_activity
        WHERE query LIKE '%' || $1 || '%' AND pid <> pg_backend_pid()`,
      [MARKER]
    );
  });

  const abortAfterQueryStarts = async (request) => {
    const aborted = request.timeout(30000).then(
      () => null,
      (err) => err
    );
    should(
      await waitFor(async () => (await activeSlowQueries()) > 0, 5000)
    ).be.true('the slow query never started');
    request.abort();
    await aborted;
  };

  it('cancels the Postgres query of an aborted GET', async () => {
    stub = sinon
      .stub(GrottoService, 'getPopulatedOrganization')
      .callsFake(() => sails.sendNativeQuery(SLOW_QUERY));

    await abortAfterQueryStarts(
      supertest(sails.hooks.http.app).get('/api/v1/organizations/1')
    );

    should(
      await waitFor(async () => (await activeSlowQueries()) === 0, 5000)
    ).be.true('the query is still running after the abort');
    sinon.assert.calledOnce(stub);
  }).timeout(20000);
});
