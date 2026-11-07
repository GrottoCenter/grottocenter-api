const fs = require('fs');
const os = require('os');
const path = require('path');
const should = require('should');
const sinon = require('sinon');
// eslint-disable-next-line import/no-extraneous-dependencies
const { Client } = require('pg');
const { DEFAULT_TEST_URL } = require('../../test-config');

const STEP_ORDER = [
  'invariant',
  'scan',
  'admission',
  'generation',
  'sitemaps',
  'audit',
];
// Fast retries: the tests never wait
const RETRY = { intervalMs: 7, maxAttempts: 3 };
const PAGES_LOCK_KEY = 1758;
const testUrl = process.env.POSTGRE_TEST_URL || DEFAULT_TEST_URL;

describe('BotPipelineService - the order, the stop rules and the run record', () => {
  let BotPipelineService;
  let BotPageGeneratorService;
  let BotSitemapService;
  let LocalStorageAdapter;
  let root;
  let adapter;
  let sleep;
  let logError;
  const query = (sql, params) => CommonService.query(sql, params);

  before(() => {
    // Sails re-requires api/ when it lifts: require the services here
    /* eslint-disable global-require */
    BotPipelineService = require('../../../api/services/bot/BotPipelineService');
    BotPageGeneratorService = require('../../../api/services/bot/BotPageGeneratorService');
    BotSitemapService = require('../../../api/services/bot/BotSitemapService');
    ({ LocalStorageAdapter } = require('../../../api/services/bot/storage'));
    /* eslint-enable global-require */
  });

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-bot-pipeline-'));
    adapter = new LocalStorageAdapter(root);
    sleep = sinon.stub().resolves();
    // The failures these tests provoke are logged at error level
    logError = sinon.stub(sails.log, 'error');
    await query('TRUNCATE t_bot_pipeline_run');
  });

  afterEach(async () => {
    sinon.restore();
    await query('TRUNCATE t_bot_pipeline_run, t_bot_page_manifest');
    fs.rmSync(root, { recursive: true, force: true });
  });

  // Every step replaced by a stub that records the order it was called in
  const stubSteps = (results = {}) => {
    const calls = [];
    const stubs = {};
    STEP_ORDER.forEach((name) => {
      stubs[name] = sinon
        .stub(BotPipelineService.steps, name)
        .callsFake(async () => {
          calls.push(name);
          return results[name] ?? { step: name };
        });
    });
    return { calls, stubs };
  };

  const run = (options = {}) =>
    BotPipelineService.run({
      adapter,
      entityTypes: ['cave', 'organization'],
      retry: RETRY,
      sleep,
      ...options,
    });

  const lastRecord = async () =>
    (await query('SELECT * FROM t_bot_pipeline_run ORDER BY id DESC LIMIT 1'))
      .rows[0];

  describe('a successful run', () => {
    it('runs the six steps in order and records them', async () => {
      const { calls, stubs } = stubSteps();

      const result = await run({ trigger: 'manual' });

      should(calls).eql(STEP_ORDER);
      STEP_ORDER.forEach((name) => should(stubs[name].callCount).equal(1));
      const record = await lastRecord();
      should(record.id).equal(result.id);
      should(record.status).equal('succeeded');
      should(record.failed_step).be.null();
      should(record.error).be.null();
      should(record.started_at).be.instanceOf(Date);
      should(record.finished_at).be.instanceOf(Date);
      // jsonb does not keep the order of the keys
      should(Object.keys(record.step_durations).sort()).eql(
        [...STEP_ORDER].sort()
      );
      STEP_ORDER.forEach((name) => {
        should(record.counts[name]).eql({ step: name });
        should(record.step_durations[name]).be.a.Number();
      });
      should(record.counts.trigger).equal('manual');
      should(record.counts.entityTypes).eql(['cave', 'organization']);
      should(record.counts.peakRssMb).be.above(0);
    });

    it('hands the allow-list and the adapter to every step', async () => {
      const { stubs } = stubSteps();

      await run({ entityTypes: ['massif'] });

      [stubs.generation, stubs.sitemaps].forEach((stub) => {
        const [context] = stub.firstCall.args;
        should(context.entityTypes).eql(['massif']);
        should(context.adapter).equal(adapter);
      });
    });

    it('logs one info line with the totals', async () => {
      stubSteps({
        admission: { cave: 2, total: 3 },
        scan: {
          scanned: { t_description: 4, t_name: 5 },
          quarantined: { t_description: 1, t_name: 0 },
        },
        generation: { uploaded: 6, unchanged: 7, deleted: 8 },
        sitemaps: { urls: 9, shards: 2 },
      });
      const info = sinon.spy(sails.log, 'info');

      await run();

      const line = info
        .getCalls()
        .map((c) => c.args[0])
        .find((text) => text.startsWith('bot-surface-nightly succeeded'));
      should(line).match(
        /admitted=3 scanned=9 quarantined=1 uploaded=6 deleted=8 unchanged=7 sitemapUrls=9 shards=2 audit=/
      );
    });

    it('records the audit as skipped while it is not implemented', async () => {
      stubSteps();
      BotPipelineService.steps.audit.restore();

      await run();

      const record = await lastRecord();
      should(record.counts.audit).eql({ skipped: 'not implemented' });
      const info = sinon.spy(sails.log, 'info');
      await run();
      should(
        info
          .getCalls()
          .some((c) =>
            /^bot-surface-nightly succeeded.*audit=skipped/.test(c.args[0])
          )
      ).be.true();
    });
  });

  describe('the stop rules', () => {
    [1, 2, 3, 4].forEach((n) => {
      const failing = STEP_ORDER[n - 1];
      it(`stops at step ${n} (${failing}): later steps do not run, the run is recorded with its failed step`, async () => {
        const { calls, stubs } = stubSteps();
        stubs[failing].callsFake(async () => {
          calls.push(failing);
          throw new Error(`${failing} broke`);
        });

        const failure = await run().catch((e) => e);

        should(failure.message).equal(`${failing} broke`);
        should(failure.failedStep).equal(n);
        should(calls).eql(STEP_ORDER.slice(0, n));
        STEP_ORDER.slice(n).forEach((name) =>
          should(stubs[name].callCount).equal(0)
        );
        const record = await lastRecord();
        should(record.status).equal('failed');
        should(record.failed_step).equal(n);
        should(record.error).containEql(`${failing} broke`);
        should(record.finished_at).be.instanceOf(Date);
        should(failure.runId).equal(record.id);
        should(Object.keys(record.step_durations).sort()).eql(
          STEP_ORDER.slice(0, n).sort()
        );
        should(
          logError
            .getCalls()
            .map((c) => c.args[0])
            .some((text) =>
              text.startsWith(`bot-surface-nightly failed at step ${n} `)
            )
        ).be.true();
      });
    });

    it('lets step 6 run after a failure of step 5, and keeps step 5 as the failed step', async () => {
      const { calls, stubs } = stubSteps();
      stubs.sitemaps.callsFake(async () => {
        calls.push('sitemaps');
        throw new Error('sitemaps broke');
      });

      const failure = await run().catch((e) => e);

      should(failure.failedStep).equal(5);
      should(calls).eql(STEP_ORDER);
      const record = await lastRecord();
      should(record.status).equal('failed');
      should(record.failed_step).equal(5);
      should(record.counts.audit).eql({ step: 'audit' });
    });

    it('records a failed step 1 for a real violation and uploads and deletes nothing', async () => {
      // The real step 1 over a database that holds a violation is covered in
      // botCascadeCheck.test.js; here the check reports one
      const { stubs } = stubSteps();
      stubs.invariant.restore();
      sinon.stub(CommonService, 'query').callThrough();
      CommonService.query
        .withArgs('SELECT * FROM bot_cascade_check()')
        .resolves({
          rows: [
            {
              violation_count: '2',
              violation_ids: [11, 12],
              override_count: '0',
              override_ids: [],
            },
          ],
        });
      const put = sinon.spy(adapter, 'put');
      const del = sinon.spy(adapter, 'delete');

      const failure = await run().catch((e) => e);

      should(failure.code).equal('E_BOT_CASCADE_VIOLATION');
      should(failure.message).match(/2 entrance\(s\).*11, 12/);
      should(stubs.scan.callCount).equal(0);
      should(put.callCount).equal(0);
      should(del.callCount).equal(0);
      should((await lastRecord()).failed_step).equal(1);
    });

    it('goes on when its record cannot be written, and logs it', async () => {
      stubSteps();
      const original = CommonService.query;
      sinon.stub(CommonService, 'query').callsFake((sql, ...rest) => {
        if (/^\s*UPDATE t_bot_pipeline_run\s+SET status = COALESCE/.test(sql)) {
          return Promise.reject(new Error('record write failed'));
        }
        return original.call(CommonService, sql, ...rest);
      });

      const result = await run();

      should(result.id).be.a.Number();
      should(
        logError.getCalls().some((c) => /could not write run/.test(c.args[0]))
      ).be.true();
    });
  });

  describe('configuration', () => {
    it('refuses an empty allow-list: nothing is generated and nothing is recorded', async () => {
      const { stubs } = stubSteps();

      const failure = await run({ entityTypes: [] }).catch((e) => e);

      should(failure.code).equal('E_BOT_NOT_CONFIGURED');
      STEP_ORDER.forEach((name) => should(stubs[name].callCount).equal(0));
      should((await query('SELECT 1 FROM t_bot_pipeline_run')).rows).be.empty();
    });

    it('reads the allow-list and the trigger from the configuration by default', async () => {
      const { stubs } = stubSteps();
      const original = sails.config.custom.botSurface;
      sails.config.custom.botSurface = { ...original, entityTypes: ['hub'] };
      try {
        await BotPipelineService.run({ adapter, retry: RETRY, sleep });
      } finally {
        sails.config.custom.botSurface = original;
      }
      should(stubs.generation.firstCall.args[0].entityTypes).eql(['hub']);
      should((await lastRecord()).counts.trigger).equal('schedule');
    });
  });

  describe('overlap', () => {
    it('does not start a second run while one is in progress, and records nothing for it', async () => {
      const { stubs } = stubSteps();
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      let entered;
      const hasEntered = new Promise((resolve) => {
        entered = resolve;
      });
      stubs.generation.callsFake(async () => {
        entered();
        await gate;
        return {};
      });

      const first = run();
      await hasEntered;
      const second = await run().catch((e) => e);
      release();
      await first;

      should(second.code).equal('E_BOT_PIPELINE_RUNNING');
      should(stubs.invariant.callCount).equal(1);
      should(stubs.generation.callCount).equal(1);
      should(
        (await query('SELECT id FROM t_bot_pipeline_run')).rows
      ).have.length(1);
      // The lock is free again
      await run();
      should(stubs.invariant.callCount).equal(2);
    });

    it('marks a run left running by a dead process as abandoned', async () => {
      stubSteps();
      await query(
        "INSERT INTO t_bot_pipeline_run (status, started_at) VALUES ('running', now() - interval '2 days')"
      );

      await run();

      const { rows } = await query(
        'SELECT status, error FROM t_bot_pipeline_run ORDER BY id'
      );
      should(rows.map((r) => r.status)).eql(['failed', 'succeeded']);
      should(rows[0].error).match(/abandoned/);
    });
  });

  describe('retention', () => {
    it('deletes the run rows older than a year and keeps the others', async () => {
      stubSteps();
      await query(
        `INSERT INTO t_bot_pipeline_run (status, started_at, finished_at) VALUES
           ('succeeded', now() - interval '13 months', now() - interval '13 months'),
           ('succeeded', now() - interval '11 months', now() - interval '11 months')`
      );

      await run();

      const { rows } = await query(
        "SELECT count(*)::int AS n FROM t_bot_pipeline_run WHERE started_at < now() - interval '12 months'"
      );
      should(rows[0].n).equal(0);
      should(
        (await query('SELECT 1 FROM t_bot_pipeline_run')).rows
      ).have.length(2);
    });
  });

  describe('waiting for the page lock (the withdrawal worker holds it for up to ~45 s)', () => {
    const keepOnly = (name) => {
      const { stubs } = stubSteps();
      stubs[name].restore();
      return stubs;
    };

    it('retries the generator while it answers E_BOT_PAGES_RUNNING, then succeeds', async () => {
      keepOnly('generation');
      const busy = () =>
        Object.assign(new Error('another run is in progress'), {
          code: 'E_BOT_PAGES_RUNNING',
        });
      const generate = sinon
        .stub(BotPageGeneratorService, 'run')
        .onCall(0)
        .rejects(busy())
        .onCall(1)
        .rejects(busy())
        .onCall(2)
        .resolves({ uploaded: 1, unchanged: 0, deleted: 0, byType: {} });

      const result = await run();

      should(generate.callCount).equal(3);
      should(sleep.callCount).equal(2);
      should(sleep.alwaysCalledWith(RETRY.intervalMs)).be.true();
      should(result.counts.generation).containEql({ uploaded: 1 });
      should((await lastRecord()).status).equal('succeeded');
    });

    it('passes the allow-list and the adapter to the generator', async () => {
      keepOnly('generation');
      const generate = sinon
        .stub(BotPageGeneratorService, 'run')
        .resolves({ uploaded: 0, unchanged: 0, deleted: 0, byType: {} });

      await run({ entityTypes: ['massif', 'hub'] });

      should(generate.firstCall.args[0]).containEql({
        adapter,
        entityTypes: ['massif', 'hub'],
      });
    });

    it('passes the allow-list and the adapter to the sitemaps', async () => {
      keepOnly('sitemaps');
      const sitemaps = sinon.stub(BotSitemapService, 'run').resolves({
        uploaded: 0,
        unchanged: 0,
        deleted: 0,
        shards: 0,
        urls: 0,
      });

      await run({ entityTypes: ['organization', 'hub'] });

      should(sitemaps.firstCall.args[0]).eql({
        adapter,
        entityTypes: ['organization', 'hub'],
      });
    });

    it('gives up after the bounded number of attempts, fails step 4 with a clear error and stops', async () => {
      const stubs = keepOnly('generation');
      const generate = sinon.stub(BotPageGeneratorService, 'run').rejects(
        Object.assign(new Error('another run is in progress'), {
          code: 'E_BOT_PAGES_RUNNING',
        })
      );

      const failure = await run().catch((e) => e);

      should(failure.code).equal('E_BOT_PAGES_LOCK_TIMEOUT');
      should(failure.message).match(
        /generation: the page lock stayed held through 3 attempts/
      );
      should(generate.callCount).equal(RETRY.maxAttempts);
      // One pause between two attempts, none after the last
      should(sleep.callCount).equal(RETRY.maxAttempts - 1);
      should(stubs.sitemaps.callCount).equal(0);
      const record = await lastRecord();
      should(record.failed_step).equal(4);
      should(record.error).match(/E_BOT_PAGES_LOCK_TIMEOUT/);
    });

    it('does not retry any other error of the generator', async () => {
      keepOnly('generation');
      const generate = sinon
        .stub(BotPageGeneratorService, 'run')
        .rejects(new Error('storage down'));

      const failure = await run().catch((e) => e);

      should(failure.message).equal('storage down');
      should(generate.callCount).equal(1);
      should(sleep.callCount).equal(0);
    });

    it('waits for the sitemaps too', async () => {
      keepOnly('sitemaps');
      const sitemaps = sinon
        .stub(BotSitemapService, 'run')
        .onCall(0)
        .rejects(
          Object.assign(new Error('busy'), { code: 'E_BOT_PAGES_RUNNING' })
        )
        .onCall(1)
        .resolves({
          uploaded: 0,
          unchanged: 0,
          deleted: 0,
          shards: 0,
          urls: 0,
        });

      await run();

      should(sitemaps.callCount).equal(2);
      should(sleep.callCount).equal(1);
    });

    it('works against the real advisory lock: runs once the holder lets go', async () => {
      keepOnly('sitemaps');
      const holder = new Client({ connectionString: testUrl });
      await holder.connect();
      try {
        await holder.query('SELECT pg_advisory_lock($1)', [PAGES_LOCK_KEY]);
        // The second pause is where the holder (the withdrawal worker) lets go
        sleep.onCall(1).callsFake(async () => {
          await holder.query('SELECT pg_advisory_unlock($1)', [PAGES_LOCK_KEY]);
        });

        const result = await run();

        should(sleep.callCount).equal(2);
        should(result.counts.sitemaps).containEql({ urls: 0 });
      } finally {
        await holder.end();
      }
    });
  });

  describe('abort', () => {
    it('fails the run at the step reached when the job is aborted', async () => {
      const { stubs } = stubSteps();
      const controller = new AbortController();
      stubs.scan.callsFake(async () => {
        controller.abort();
        return {};
      });

      const failure = await run({ signal: controller.signal }).catch((e) => e);

      should(failure.failedStep).equal(3);
      should(stubs.admission.callCount).equal(0);
      should((await lastRecord()).status).equal('failed');
    });
  });
});
