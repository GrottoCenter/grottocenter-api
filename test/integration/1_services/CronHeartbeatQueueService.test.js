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

  describe('start()', () => {
    let originalBoss;
    let boss;

    beforeEach(() => {
      originalBoss = sails.enrichmentBoss;
      boss = {
        createQueue: sinon.stub().resolves(),
        schedule: sinon.stub().resolves(),
        work: sinon.stub().resolves('worker-id'),
      };
      sails.enrichmentBoss = boss;
    });

    afterEach(() => {
      sails.enrichmentBoss = originalBoss;
    });

    it('schedules the daily check after the cron window and registers the worker', async () => {
      const service = sails.services.cronheartbeatqueueservice;
      await service.start();
      should(boss.createQueue.firstCall.args[0]).equal('cron-heartbeat');
      should(boss.schedule.firstCall.args).eql([
        'cron-heartbeat',
        '30 5 * * *',
        null,
        { tz: 'UTC' },
      ]);
      should(boss.work.firstCall.args[0]).equal('cron-heartbeat');
      should(boss.work.firstCall.args[2]).be.a.Function();
    });

    // Without includeMetadata pg-boss hides retryLimit, the last attempt is
    // never recognised, and a run still going after the retries ends in a
    // silent failed job instead of a /fail
    it('registers the worker with includeMetadata', async () => {
      await sails.services.cronheartbeatqueueservice.start();
      should(boss.work.firstCall.args[1]).eql({ includeMetadata: true });
    });

    // The last attempt must come before the monitor's 2 hour grace (5:30 ping
    // plus grace) runs out, or the /fail it sends is as late as no ping
    it('retries for less than the 2 hour grace of the monitor', () => {
      const { retryLimit, retryDelay } =
        sails.services.cronheartbeatqueueservice.QUEUE_OPTIONS;
      should(retryLimit * retryDelay).be.below(2 * 60 * 60);
    });
  });

  describe('while a run is still in progress', () => {
    const running = {
      'Refresh data quality view daily': { status: 'running', end_time: null },
    };

    it('throws, so that pg-boss checks again later, and pings nothing', async () => {
      readLatestRuns.resolves(allJobs(running));
      await processJob([
        { retryCount: 0, retryLimit: 11 },
      ]).should.be.rejectedWith(/still running/);
      sinon.assert.notCalled(fetchStub);
    });

    it('sends one success ping when the run has finished at the re-check', async () => {
      readLatestRuns.onFirstCall().resolves(allJobs(running));
      readLatestRuns.onSecondCall().resolves(allJobs());
      await processJob([
        { retryCount: 0, retryLimit: 11 },
      ]).should.be.rejected();
      await processJob([{ retryCount: 1, retryLimit: 11 }]);
      should(pinged()).eql([URL_OK]);
    });

    it('reports /fail on the last attempt, a run that long is stuck', async () => {
      readLatestRuns.resolves(allJobs(running));
      await processJob([{ retryCount: 11, retryLimit: 11 }]);
      should(pinged()).eql([`${URL_OK}/fail`]);
    });

    it('still reports /fail at once when another job failed', async () => {
      readLatestRuns.resolves(
        allJobs({ ...running, 'Trim bot outbox daily': { status: 'failed' } })
      );
      await processJob([{ retryCount: 0, retryLimit: 11 }]);
      should(pinged()).eql([`${URL_OK}/fail`]);
    });
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
