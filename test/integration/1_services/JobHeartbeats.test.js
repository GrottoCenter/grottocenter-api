const fs = require('fs');
const path = require('path');
const should = require('should');
const sinon = require('sinon');

// Every scheduled pg-boss job reports to its own heartbeat monitor
// (docs/agents/scheduled-jobs.md). The behaviour of the wrapper is tested in
// 2_utils/heartbeat; this runs each real handler with its dependency stubbed
// and checks that the monitor is called, so a handler that is no longer
// wrapped, or wired to another job's config key, fails here.
//
// The dependencies are required inside the stubs, at run time, like the
// handlers do (see "Testing" in AGENTS.md).
/* eslint-disable global-require */
const JOBS = [
  {
    service: 'SearchOutboxQueueService',
    key: 'searchOutbox',
    stub: (fails) => {
      const outbox = require('../../../api/dbSync/searchOutbox');
      const drain = sinon.stub(outbox, 'drain');
      if (fails) drain.rejects(new Error('drain failed'));
      else drain.resolves(0);
      sinon.stub(outbox, 'backlog').resolves({ pending: 0, oldestSeconds: 0 });
    },
  },
  {
    service: 'BotOutboxQueueService',
    key: 'botOutbox',
    stub: (fails) => {
      const BotOutboxService = require('../../../api/services/bot/BotOutboxService');
      const run = sinon.stub(BotOutboxService, 'run');
      if (fails) run.rejects(new Error('run failed'));
      else run.resolves({ skipped: true });
      sinon
        .stub(BotOutboxService, 'backlog')
        .resolves({ pending: 0, oldestSeconds: 0 });
      sinon
        .stub(
          require('../../../api/services/bot/storage'),
          'createStorageAdapter'
        )
        .returns({});
    },
  },
  {
    service: 'AvatarCleanupQueueService',
    key: 'avatarCleanup',
    stub: (fails) => {
      const stub = sinon.stub(
        sails.services.avatarservice,
        'retryPendingDeletions'
      );
      if (fails) stub.rejects(new Error('storage down'));
      else stub.resolves({ deleted: 0, failed: 0, kept: 0 });
    },
  },
  {
    service: 'BotPipelineQueueService',
    key: 'botPipeline',
    stub: (fails) => {
      const run = sinon.stub(
        require('../../../api/services/bot/BotPipelineService'),
        'run'
      );
      if (fails) run.rejects(new Error('pipeline failed'));
      else run.resolves();
    },
  },
  {
    service: 'DbExportQueueService',
    key: 'dbExport',
    retries: true,
    stub: (fails) => {
      const makeDbExport = sinon.stub(
        require('../../../api/dbSync/dbExport'),
        'makeDbExport'
      );
      if (fails) makeDbExport.rejects(new Error('export failed'));
      else makeDbExport.resolves();
    },
  },
  {
    service: 'SearchReconcileQueueService',
    key: 'searchReconcile',
    retries: true,
    stub: (fails) => {
      const reconcile = sinon.stub(
        require('../../../api/dbSync/reconcile'),
        'reconcile'
      );
      if (fails) reconcile.rejects(new Error('reconcile failed'));
      else reconcile.resolves();
    },
  },
];
/* eslint-enable global-require */

// A service that schedules a pg-boss job but is not in JOBS: its monitoring was
// forgotten. CronHeartbeatQueueService reports the pg_cron jobs, not itself.
const NOT_REPORTING = ['CronHeartbeatQueueService'];
// The free Better Stack plan allows ten; the AI server backup uses one more
const HEARTBEAT_LIMIT = 10;
const OUTSIDE_THIS_API = 1;

describe('Scheduled job heartbeats', () => {
  let heartbeats;
  let fetchStub;
  let counter = 0;
  let url;
  let original;

  before(() => {
    ({ heartbeats } = sails.config.custom);
  });

  it('covers every service that schedules a job', () => {
    const dir = path.join(__dirname, '../../../api/services');
    const scheduling = fs
      .readdirSync(dir)
      .filter((f) => /QueueService\.js$/.test(f))
      .filter((f) =>
        /boss\.schedule\(/.test(fs.readFileSync(path.join(dir, f), 'utf8'))
      )
      .map((f) => f.replace(/\.js$/, ''))
      .filter((name) => !NOT_REPORTING.includes(name));
    should(scheduling.sort()).eql(
      JOBS.map((j) => j.service).sort(),
      'a service schedules a job without a heartbeat test: see docs/agents/scheduled-jobs.md, "Adding a scheduled job"'
    );
  });

  it('stays within the free plan heartbeat limit', () => {
    const used = Object.keys(heartbeats).length + OUTSIDE_THIS_API;
    should(used).be.belowOrEqual(
      HEARTBEAT_LIMIT,
      `${used} heartbeat monitors, the free Better Stack plan allows ${HEARTBEAT_LIMIT}: group jobs or upgrade, see docs/agents/scheduled-jobs.md`
    );
  });

  it('declares one distinct key per job', () => {
    // The pg_cron jobs share one monitor, reported by CronHeartbeatQueueService (tested in its own file)
    should(Object.keys(heartbeats).sort()).eql(
      [...JOBS.map((j) => j.key), 'cronJobs'].sort()
    );
  });

  JOBS.forEach(({ service, key, retries, stub }) => {
    describe(service, () => {
      let processJob;

      beforeEach(() => {
        // A new URL per test: the throttle of the per-minute jobs is keyed by URL
        counter += 1;
        url = `https://example.test/heartbeat/${key}-${counter}`;
        original = heartbeats[key];
        heartbeats[key] = url;
        fetchStub = sinon.stub(global, 'fetch').resolves({ ok: true });
        ({ processJob } = sails.services[service.toLowerCase()]);
      });

      afterEach(() => {
        heartbeats[key] = original;
        sinon.restore();
      });

      it('pings its own monitor when a run succeeds', async () => {
        stub(false);
        await processJob([{ retryCount: 0 }]);
        sinon.assert.calledOnce(fetchStub);
        should(fetchStub.firstCall.args[0]).equal(url);
      });

      it('pings /fail and rethrows when the last attempt fails', async () => {
        stub(true);
        await processJob([
          { retryCount: 1, retryLimit: 1 },
        ]).should.be.rejected();
        sinon.assert.calledOnce(fetchStub);
        should(fetchStub.firstCall.args[0]).equal(`${url}/fail`);
      });

      it('sends nothing when no URL is configured', async () => {
        heartbeats[key] = undefined;
        stub(false);
        await processJob([{ retryCount: 0 }]);
        sinon.assert.notCalled(fetchStub);
      });

      if (retries) {
        it('does not report a first failed attempt that pg-boss retries', async () => {
          stub(true);
          await processJob([
            { retryCount: 0, retryLimit: 1 },
          ]).should.be.rejected();
          sinon.assert.notCalled(fetchStub);
        });
      }
    });
  });
});
