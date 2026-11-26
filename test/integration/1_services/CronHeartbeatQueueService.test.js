const should = require('should');
const sinon = require('sinon');

// Required inside the hooks, at run time, like the service does (see "Testing"
// in AGENTS.md): a top-level require would be a stale copy of the module
/* eslint-disable global-require */
const HOUR = 60 * 60 * 1000;
const URL_OK = 'https://example.test/heartbeat/cron-jobs';
const recent = (extra = {}) => ({
  status: 'succeeded',
  start_time: new Date(Date.now() - 20 * 60000),
  end_time: new Date(Date.now() - 10 * 60000),
  ...extra,
});

describe('CronHeartbeatQueueService', () => {
  let heartbeats;
  let original;
  let fetchStub;
  let readLatestRuns;
  let processJob;
  let allJobs;

  before(() => {
    ({ heartbeats } = sails.config.custom);
  });

  beforeEach(() => {
    original = heartbeats.cronJobs;
    heartbeats.cronJobs = URL_OK;
    fetchStub = sinon.stub(global, 'fetch').resolves({ ok: true });
    const cron = require('../../../api/utils/cronHeartbeat');
    readLatestRuns = sinon.stub(cron, 'readLatestRuns');
    allJobs = (override = {}) =>
      cron.CRON_JOBS.map(({ jobname }) => ({
        jobname,
        ...recent(override[jobname]),
      }));
    ({ processJob } = sails.services.cronheartbeatqueueservice);
  });

  afterEach(() => {
    heartbeats.cronJobs = original;
    sinon.restore();
  });

  const pinged = () => fetchStub.getCalls().map((c) => c.args[0]);

  it('sends one ping when every job succeeded', async () => {
    readLatestRuns.resolves(allJobs());
    await processJob();
    should(pinged()).eql([URL_OK]);
  });

  it('reads the pg_cron database, not the application one', async () => {
    readLatestRuns.resolves(allJobs());
    await processJob();
    sinon.assert.calledOnce(readLatestRuns);
    should(new URL(readLatestRuns.firstCall.args[0]).pathname).equal(
      '/postgres'
    );
  });

  [
    ['a job failed', { 'Trim bot outbox daily': { status: 'failed' } }],
    [
      'a job ran too long ago',
      {
        'Refresh country info view every 3 days': {
          end_time: new Date(Date.now() - 100 * HOUR),
        },
      },
    ],
  ].forEach(([title, override]) => {
    it(`sends a single /fail when ${title}`, async () => {
      readLatestRuns.resolves(allJobs(override));
      await processJob();
      should(pinged()).eql([`${URL_OK}/fail`]);
    });
  });

  it('sends /fail when a job is missing from the history', async () => {
    readLatestRuns.resolves(allJobs().slice(1));
    await processJob();
    should(pinged()).eql([`${URL_OK}/fail`]);
  });

  it('names the jobs that need attention in the log, not in the URL', async () => {
    const warn = sinon.stub(sails.log, 'warn');
    readLatestRuns.resolves(
      allJobs({ 'Trim bot outbox daily': { status: 'failed' } })
    );
    await processJob();
    should(
      warn
        .getCalls()
        .map((c) => c.args[0])
        .join('\n')
    ).match(/Trim bot outbox daily/);
  });

  it('sends nothing while a run is in progress and the others are fine', async () => {
    readLatestRuns.resolves(
      allJobs({
        'Refresh data quality view daily': {
          status: 'running',
          end_time: null,
        },
      })
    );
    await processJob();
    sinon.assert.notCalled(fetchStub);
  });

  it('still fails when another job failed while one is in progress', async () => {
    readLatestRuns.resolves(
      allJobs({
        'Refresh data quality view daily': {
          status: 'running',
          end_time: null,
        },
        'Trim bot outbox daily': { status: 'failed' },
      })
    );
    await processJob();
    should(pinged()).eql([`${URL_OK}/fail`]);
  });

  it('does not even connect when no monitor is configured', async () => {
    heartbeats.cronJobs = undefined;
    await processJob();
    sinon.assert.notCalled(readLatestRuns);
    sinon.assert.notCalled(fetchStub);
  });

  it('throws when the history cannot be read, and pings nothing', async () => {
    readLatestRuns.rejects(new Error('permission denied for schema cron'));
    await processJob().should.be.rejectedWith(/permission denied/);
    sinon.assert.notCalled(fetchStub);
  });
});
