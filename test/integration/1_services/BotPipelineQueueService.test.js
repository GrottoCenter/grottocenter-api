const os = require('os');
const should = require('should');
const sinon = require('sinon');
// eslint-disable-next-line import/no-extraneous-dependencies
const { Client } = require('pg');
const { PgBoss } = require('pg-boss');
const { DEFAULT_TEST_URL } = require('../../test-config');

const testUrl = process.env.POSTGRE_TEST_URL || DEFAULT_TEST_URL;
const PG_BOSS_SCHEMA = 'pgboss_bot_pipeline_test';

describe('BotPipelineQueueService - the bot-surface-nightly job', () => {
  let BotPipelineQueueService;
  let BotPipelineService;
  let originalBoss;
  let originalBotSurface;

  before(() => {
    /* eslint-disable global-require */
    BotPipelineQueueService = require('../../../api/services/BotPipelineQueueService');
    BotPipelineService = require('../../../api/services/bot/BotPipelineService');
    /* eslint-enable global-require */
    originalBoss = sails.enrichmentBoss;
    originalBotSurface = sails.config.custom.botSurface;
  });

  afterEach(() => {
    sails.enrichmentBoss = originalBoss;
    sails.config.custom.botSurface = originalBotSurface;
    sinon.restore();
  });

  const fakeBoss = () => ({
    createQueue: sinon.stub().resolves(),
    schedule: sinon.stub().resolves(),
    unschedule: sinon.stub().resolves(),
    getQueue: sinon.stub().resolves(null),
    work: sinon.stub().resolves('worker-id'),
    send: sinon.stub().resolves('job-1'),
  });

  const configure = (overrides) => {
    sails.config.custom.botSurface = {
      ...originalBotSurface,
      storage: { driver: 'local', localDir: os.tmpdir() },
      ...overrides,
    };
  };

  describe('configuration', () => {
    it('is off by default: no type listed, not enabled, the default schedule is 01:30 UTC', () => {
      should(originalBotSurface.enabled).be.false();
      should(originalBotSurface.entityTypes).eql([]);
      should(originalBotSurface.schedule).equal('30 1 * * *');
    });

    it('uses an exclusive queue, with an expiry of hours and no retry', () => {
      should(BotPipelineQueueService.QUEUE_NAME).equal('bot-surface-nightly');
      should(BotPipelineQueueService.QUEUE_OPTIONS).eql({
        policy: 'exclusive',
        expireInSeconds: 4 * 3600,
        retryLimit: 0,
      });
    });
  });

  describe('start()', () => {
    it('creates the queue, schedules it from the configuration with missed once, and registers the worker', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      configure({
        enabled: true,
        entityTypes: ['organization'],
        schedule: '15 2 * * *',
      });

      await BotPipelineQueueService.start();

      should(boss.createQueue.firstCall.args).eql([
        'bot-surface-nightly',
        BotPipelineQueueService.QUEUE_OPTIONS,
      ]);
      should(boss.schedule.firstCall.args).eql([
        'bot-surface-nightly',
        '15 2 * * *',
        null,
        { tz: 'UTC', missed: 'once' },
      ]);
      should(boss.unschedule.called).be.false();
      should(boss.work.firstCall.args[0]).equal('bot-surface-nightly');
      should(boss.work.firstCall.args[1]).equal(
        BotPipelineQueueService.processJob
      );
      should(boss.createQueue.calledBefore(boss.schedule)).be.true();
      should(boss.createQueue.calledBefore(boss.work)).be.true();
    });

    it('registers the worker but no schedule, and removes an old one, while BOT_SURFACE_ENABLED is not true', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      configure({ enabled: false, entityTypes: ['cave'] });

      await BotPipelineQueueService.start();

      should(boss.schedule.called).be.false();
      should(boss.unschedule.calledOnceWith('bot-surface-nightly')).be.true();
      should(boss.work.calledOnce).be.true();
    });

    it('registers nothing while no entity type is listed, even when enabled', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      configure({ enabled: true, entityTypes: [] });

      await BotPipelineQueueService.start();

      should(boss.createQueue.called).be.false();
      should(boss.schedule.called).be.false();
      should(boss.work.called).be.false();
      should(boss.unschedule.called).be.false();
    });

    it('removes a schedule left by an earlier configuration when no entity type is listed any more', async () => {
      const boss = fakeBoss();
      boss.getQueue.resolves({ name: 'bot-surface-nightly' });
      sails.enrichmentBoss = boss;
      configure({ enabled: true, entityTypes: [] });

      await BotPipelineQueueService.start();

      should(boss.unschedule.calledOnceWith('bot-surface-nightly')).be.true();
      should(boss.work.called).be.false();
    });

    it('does nothing when pg-boss is not available', async () => {
      sails.enrichmentBoss = null;
      configure({ enabled: true, entityTypes: ['cave'] });
      await should(BotPipelineQueueService.start()).be.fulfilled();
    });

    it('fails to start with the local storage in production, so a forgotten BOT_PAGES_STORAGE does not publish nowhere', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      configure({ enabled: true, entityTypes: ['cave'] });
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await should(BotPipelineQueueService.start()).be.rejectedWith(
          /BOT_PAGES_STORAGE=azure/
        );
      } finally {
        process.env.NODE_ENV = previous;
      }
      should(boss.createQueue.called).be.false();
      should(boss.work.called).be.false();
    });
  });

  describe('processJob()', () => {
    it('runs the pipeline with the job signal and its trigger', async () => {
      const run = sinon.stub(BotPipelineService, 'run').resolves({});
      const controller = new AbortController();

      await BotPipelineQueueService.processJob([
        { signal: controller.signal, data: { trigger: 'manual' } },
      ]);

      should(run.firstCall.args[0]).eql({
        signal: controller.signal,
        trigger: 'manual',
      });
    });

    it('runs as a scheduled run when the job carries no data', async () => {
      const run = sinon.stub(BotPipelineService, 'run').resolves({});
      await BotPipelineQueueService.processJob([{ data: null }]);
      should(run.firstCall.args[0].trigger).equal('schedule');
    });

    it('lets a failure of the pipeline reach pg-boss', async () => {
      sinon.stub(BotPipelineService, 'run').rejects(new Error('step 2 broke'));
      await should(BotPipelineQueueService.processJob([{}])).be.rejectedWith(
        'step 2 broke'
      );
    });
  });

  describe('enqueue() (the manual trigger)', () => {
    it('sends a manual job to the queue', async () => {
      const boss = fakeBoss();
      configure({ entityTypes: ['cave'] });

      const result = await BotPipelineQueueService.enqueue(boss);

      should(result).eql({ enqueued: true, jobId: 'job-1' });
      should(boss.createQueue.calledBefore(boss.send)).be.true();
      should(boss.send.firstCall.args).eql([
        'bot-surface-nightly',
        { trigger: 'manual' },
      ]);
    });

    it('works whether or not BOT_SURFACE_ENABLED is true', async () => {
      const boss = fakeBoss();
      configure({ enabled: false, entityTypes: ['cave'] });
      should((await BotPipelineQueueService.enqueue(boss)).enqueued).be.true();
    });

    it('reports that nothing was enqueued when pg-boss refuses it (a run is queued or running)', async () => {
      const boss = fakeBoss();
      boss.send.resolves(null);
      configure({ entityTypes: ['cave'] });

      should(await BotPipelineQueueService.enqueue(boss)).eql({
        enqueued: false,
        jobId: null,
      });
    });

    it('refuses cleanly when no entity type is listed, and sends nothing', async () => {
      const boss = fakeBoss();
      configure({ entityTypes: [] });

      const failure = await BotPipelineQueueService.enqueue(boss).catch(
        (e) => e
      );

      should(failure.code).equal('E_BOT_NOT_CONFIGURED');
      should(failure.message).match(
        /BOT_SURFACE_ENTITY_TYPES lists no entity type/
      );
      should(boss.send.called).be.false();
      should(boss.createQueue.called).be.false();
    });

    it('refuses an invalid storage', async () => {
      const boss = fakeBoss();
      configure({ entityTypes: ['cave'] });
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await should(BotPipelineQueueService.enqueue(boss)).be.rejectedWith(
          /BOT_PAGES_STORAGE=azure/
        );
      } finally {
        process.env.NODE_ENV = previous;
      }
      should(boss.send.called).be.false();
    });
  });

  // A real pg-boss on the test database, in a schema of its own
  describe('on a real pg-boss', function realPgBoss() {
    this.timeout(60000);
    let boss;

    before(async () => {
      boss = new PgBoss({
        connectionString: testUrl,
        schema: PG_BOSS_SCHEMA,
        supervise: false,
        schedule: false,
      });
      boss.on('error', () => {});
      await boss.start();
    });

    after(async () => {
      await boss.stop({ graceful: false, timeout: 5000 });
      const client = new Client({ connectionString: testUrl });
      await client.connect();
      try {
        await client.query(`DROP SCHEMA IF EXISTS ${PG_BOSS_SCHEMA} CASCADE`);
      } finally {
        await client.end();
      }
    });

    it('registers the schedule from the configuration, with the exclusive policy and the expiry', async () => {
      sails.enrichmentBoss = boss;
      configure({
        enabled: true,
        entityTypes: ['organization'],
        schedule: '45 2 * * *',
      });
      // No worker in this test: processing is covered below
      sinon.stub(boss, 'work').resolves('worker-id');

      await BotPipelineQueueService.start();

      const [schedule] = (await boss.getSchedules()).filter(
        (s) => s.name === 'bot-surface-nightly'
      );
      should(schedule).containEql({ cron: '45 2 * * *', timezone: 'UTC' });
      const queue = await boss.getQueue('bot-surface-nightly');
      should(queue).containEql({
        policy: 'exclusive',
        expireInSeconds: 4 * 3600,
      });
      boss.work.restore();

      // Switching the flag off removes the schedule
      configure({ enabled: false, entityTypes: ['organization'] });
      sinon.stub(boss, 'work').resolves('worker-id');
      await BotPipelineQueueService.start();
      should(
        (await boss.getSchedules()).filter(
          (s) => s.name === 'bot-surface-nightly'
        )
      ).be.empty();
    });

    it('never runs two enqueued runs together', async () => {
      configure({ entityTypes: ['organization'] });
      await boss.createQueue(
        BotPipelineQueueService.QUEUE_NAME,
        BotPipelineQueueService.QUEUE_OPTIONS
      );
      // Two enqueues in a row: the second is refused while the first is queued
      const first = await BotPipelineQueueService.enqueue(boss);
      const second = await BotPipelineQueueService.enqueue(boss);
      should(first.enqueued).be.true();
      should(second).eql({ enqueued: false, jobId: null });

      // The worker takes the first; the pipeline is held while we enqueue again
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      let started;
      const hasStarted = new Promise((resolve) => {
        started = resolve;
      });
      let concurrent = 0;
      let maxConcurrent = 0;
      const run = sinon.stub(BotPipelineService, 'run').callsFake(async () => {
        concurrent += 1;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        started();
        await gate;
        concurrent -= 1;
        return {};
      });
      const workerId = await boss.work(
        BotPipelineQueueService.QUEUE_NAME,
        BotPipelineQueueService.processJob
      );
      try {
        await hasStarted;
        const whileRunning = await BotPipelineQueueService.enqueue(boss);
        should(whileRunning.enqueued).be.false();
        release();
        // Once the run is over, a new one is accepted
        let after;
        for (let i = 0; i < 50 && !after; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          const attempt = await BotPipelineQueueService.enqueue(boss);
          if (attempt.enqueued) after = attempt;
          else {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => {
              setTimeout(resolve, 200);
            });
          }
        }
        should(after).be.ok();
        should(run.callCount).be.aboveOrEqual(1);
        should(maxConcurrent).equal(1);
      } finally {
        await boss.offWork(BotPipelineQueueService.QUEUE_NAME);
        should(workerId).be.ok();
      }
    });
  });
});
