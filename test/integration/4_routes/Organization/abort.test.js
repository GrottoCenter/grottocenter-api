const should = require('should');
const sinon = require('sinon');
const supertest = require('supertest');
const guardPgPool = require('../../../../api/utils/guardPgPool');
const logger = require('../../../../api/utils/logger');

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

  it('never starts the query of a GET aborted before it got a connection', async () => {
    // Stands for a GET queued behind a full pool: it holds no connection yet
    // when its client goes away.
    let reached;
    const atGate = new Promise((resolve) => {
      reached = resolve;
    });
    let openGate;
    const gate = new Promise((resolve) => {
      openGate = resolve;
    });
    let settle;
    const outcome = new Promise((resolve) => {
      settle = resolve;
    });
    stub = sinon
      .stub(GrottoService, 'getPopulatedOrganization')
      .callsFake(async () => {
        reached();
        await gate;
        return sails.sendNativeQuery(SLOW_QUERY).then(
          () => settle(null),
          (err) => settle(err)
        );
      });

    const request = supertest(sails.hooks.http.app)
      .get('/api/v1/organizations/1')
      .timeout(30000);
    const aborted = request.then(
      () => null,
      (err) => err
    );
    await atGate;
    request.abort();
    await aborted;
    // Let the server see the closed socket before the GET asks for its
    // connection.
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
    openGate();

    should(await outcome).match({ raw: { error: { code: '57014' } } });
    should(await activeSlowQueries()).equal(0);
  }).timeout(20000);

  // #1919: the 500 an aborted request ends with goes nowhere, and a cancelled
  // query is no server error. Triage counts `Sending 500` lines.
  describe('logging of the 500 it ends with', () => {
    let StatisticsMassifService;
    let lines;
    let logStubs;

    before(() => {
      // eslint-disable-next-line global-require
      StatisticsMassifService = require('../../../../api/services/StatisticsMassifService');
    });

    // patchSailsLog() is where the downgrade lives, and the test environment
    // never calls it. Stubbed first, so the patch delegates to the collectors.
    beforeEach(() => {
      lines = [];
      const collect =
        (level) =>
        (...args) =>
          lines.push({ level, line: args.map(String).join(' ') });
      logStubs = ['info', 'warn', 'error'].map((level) =>
        sinon.stub(sails.log, level).callsFake(collect(level))
      );
      logger.patchSailsLog();
    });

    // Restoring the stubs also discards the patch wrapper, which matters
    // because patchSailsLog is not idempotent.
    afterEach(() => logStubs.forEach((logStub) => logStub.restore()));

    const linesWith = (text) => lines.filter(({ line }) => line.includes(text));
    const errorLines = () => lines.filter(({ level }) => level === 'error');

    const expectDroppedResponse = async () => {
      should(
        await waitFor(async () => linesWith('Dropped 500').length > 0, 5000)
      ).be.true('the dropped response was never logged');
      should(linesWith('Dropped 500')[0].level).equal('warn');
      should(linesWith('Sending 500')).be.empty();
      should(errorLines()).be.empty();
    };

    it('logs the cancelled query of an uncaught throw as a dropped response', async () => {
      stub = sinon
        .stub(GrottoService, 'getPopulatedOrganization')
        .callsFake(() => sails.sendNativeQuery(SLOW_QUERY));

      await abortAfterQueryStarts(
        supertest(sails.hooks.http.app).get('/api/v1/organizations/1')
      );

      await expectDroppedResponse();
    }).timeout(20000);

    it('logs the cancelled query a controller catches itself as a dropped response', async () => {
      // The controller logs the error and answers with its own message, which
      // carries no `57014` for the logger to recognise.
      stub = sinon
        .stub(StatisticsMassifService, 'getNbCavesInMassif')
        .callsFake(() => sails.sendNativeQuery(SLOW_QUERY));

      await abortAfterQueryStarts(
        supertest(sails.hooks.http.app).get('/api/v1/massifs/1/statistics')
      );

      await expectDroppedResponse();
    }).timeout(20000);

    it('keeps the 500 of a request whose client is still there', async () => {
      stub = sinon
        .stub(GrottoService, 'getPopulatedOrganization')
        .rejects(new Error('boom'));

      await supertest(sails.hooks.http.app)
        .get('/api/v1/organizations/1')
        .expect(500);

      should(linesWith('Sending 500')).have.length(1);
      should(linesWith('Sending 500')[0].level).equal('error');
      should(linesWith('Dropped 500')).be.empty();
    });
  });
});
