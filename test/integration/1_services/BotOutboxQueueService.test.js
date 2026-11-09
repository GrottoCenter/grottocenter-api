const should = require('should');
const os = require('os');
const sinon = require('sinon');

describe('BotOutboxQueueService', () => {
  let BotOutboxQueueService;
  let BotOutboxService;
  let originalBoss;
  let originalBotSurface;

  before(() => {
    /* eslint-disable global-require */
    BotOutboxQueueService = require('../../../api/services/BotOutboxQueueService');
    BotOutboxService = require('../../../api/services/bot/BotOutboxService');
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
  });

  describe('configuration', () => {
    it('is off unless BOT_SURFACE_ENABLED is true', () => {
      should(originalBotSurface.enabled).be.false();
    });
  });

  describe('start()', () => {
    it('creates an exclusive queue, schedules it every minute and registers its worker', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      sails.config.custom.botSurface = {
        ...originalBotSurface,
        enabled: true,
        entityTypes: ['cave', 'massif', 'organization'],
      };

      await BotOutboxQueueService.start();

      const [queueName, queueOptions] = boss.createQueue.firstCall.args;
      should(queueName).equal('bot-outbox');
      should(queueOptions).have.properties({
        policy: 'exclusive',
        retryLimit: 0,
      });
      should(boss.schedule.firstCall.args).eql([
        'bot-outbox',
        '* * * * *',
        null,
        { tz: 'UTC' },
      ]);
      should(boss.work.firstCall.args[0]).equal('bot-outbox');
      should(boss.work.firstCall.args[1]).equal(
        BotOutboxQueueService.processJob
      );
      should(boss.createQueue.calledBefore(boss.schedule)).be.true();
      should(boss.createQueue.calledBefore(boss.work)).be.true();
    });

    it('registers nothing while the bot surface is not enabled', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      sails.config.custom.botSurface = {
        ...originalBotSurface,
        enabled: false,
      };

      await BotOutboxQueueService.start();

      should(boss.createQueue.called).be.false();
      should(boss.schedule.called).be.false();
      should(boss.work.called).be.false();
    });

    it('stays off while no entity type is listed, even when enabled: it would delete every page it is asked about', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      sails.config.custom.botSurface = {
        ...originalBotSurface,
        enabled: true,
        entityTypes: [],
      };

      await BotOutboxQueueService.start();

      should(boss.createQueue.called).be.false();
      should(boss.schedule.called).be.false();
      should(boss.work.called).be.false();
      should(boss.unschedule.called).be.false();
    });

    it('removes a schedule left by an earlier configuration when no entity type is listed any more', async () => {
      const boss = fakeBoss();
      boss.getQueue.resolves({ name: 'bot-outbox' });
      sails.enrichmentBoss = boss;
      sails.config.custom.botSurface = {
        ...originalBotSurface,
        enabled: true,
        entityTypes: [],
      };

      await BotOutboxQueueService.start();

      should(boss.unschedule.calledOnceWith('bot-outbox')).be.true();
      should(boss.work.called).be.false();
    });

    it('does nothing when pg-boss is not available', async () => {
      sails.enrichmentBoss = null;
      sails.config.custom.botSurface = {
        ...originalBotSurface,
        enabled: true,
        entityTypes: ['cave', 'massif', 'organization'],
      };
      await should(BotOutboxQueueService.start()).be.fulfilled();
    });

    it('fails to start with the local storage in production, so a forgotten BOT_PAGES_STORAGE does not forget pages that stay online', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      sails.config.custom.botSurface = {
        ...originalBotSurface,
        enabled: true,
        entityTypes: ['cave', 'massif', 'organization'],
        storage: { driver: 'local', localDir: os.tmpdir() },
      };
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await should(BotOutboxQueueService.start()).be.rejectedWith(
          /BOT_PAGES_STORAGE=azure/
        );
      } finally {
        process.env.NODE_ENV = previous;
      }
      should(boss.createQueue.called).be.false();
      should(boss.work.called).be.false();
    });

    it('logs the storage driver when it starts', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      sails.config.custom.botSurface = {
        ...originalBotSurface,
        enabled: true,
        entityTypes: ['cave', 'massif', 'organization'],
        storage: { driver: 'local', localDir: os.tmpdir() },
      };
      const info = sinon.stub(sails.log, 'info');
      try {
        await BotOutboxQueueService.start();
        should(info.getCalls().map((call) => call.args[0])).containEql(
          'BotOutboxQueueService: started and listening for jobs (storage local)'
        );
      } finally {
        info.restore();
      }
    });

    it('fails, rather than failing every minute, when the storage is misconfigured', async () => {
      const boss = fakeBoss();
      sails.enrichmentBoss = boss;
      sails.config.custom.botSurface = {
        ...originalBotSurface,
        enabled: true,
        entityTypes: ['cave', 'massif', 'organization'],
        storage: { driver: 'azure' },
      };

      await should(BotOutboxQueueService.start()).be.rejected();

      should(boss.work.called).be.false();
    });
  });

  describe('processJob()', () => {
    let backlogStub;
    let infoStub;
    let errorStub;
    const result = {
      skipped: false,
      rows: 4,
      pages: 5,
      rendered: 5,
      uploaded: 1,
      redirected: 1,
      deleted: 2,
      unchanged: 1,
    };

    beforeEach(() => {
      backlogStub = sinon
        .stub(BotOutboxService, 'backlog')
        .resolves({ pending: 2, oldestSeconds: 95 });
      infoStub = sinon.stub(sails.log, 'info');
      errorStub = sinon.stub(sails.log, 'error');
    });

    it('runs the worker with a storage adapter, watching the job signal', async () => {
      const runStub = sinon.stub(BotOutboxService, 'run').resolves(result);
      const { signal } = new AbortController();

      await BotOutboxQueueService.processJob([{ id: 'job', signal }]);

      should(runStub.calledOnce).be.true();
      should(runStub.firstCall.args[0].signal).equal(signal);
      should(runStub.firstCall.args[0].adapter.put).be.a.Function();
    });

    // The operations workbook may parse this line: keep its format
    it('logs one line per run with the counts and what is left', async () => {
      sinon.stub(BotOutboxService, 'run').resolves(result);

      await BotOutboxQueueService.processJob([]);

      should(infoStub.callCount).equal(1);
      should(infoStub.firstCall.args[0]).match(
        /^BotOutboxQueueService: run rows=4 pages=5 rendered=5 uploaded=1 redirected=1 deleted=2 unchanged=1 pending=2 oldestSeconds=95 durationMs=\d+$/
      );
    });

    it('logs a skipped minute once, at info level, and does not fail', async () => {
      sinon
        .stub(BotOutboxService, 'run')
        .resolves({ ...result, skipped: true });

      await BotOutboxQueueService.processJob([]);

      should(errorStub.called).be.false();
      should(infoStub.callCount).equal(1);
      should(infoStub.firstCall.args[0]).match(
        /^BotOutboxQueueService: run skipped, a generation or sitemap run holds the lock pending=2 oldestSeconds=95 durationMs=\d+$/
      );
    });

    it('logs a failed run, then rethrows it so pg-boss records it', async () => {
      const failure = new Error('storage down');
      sinon.stub(BotOutboxService, 'run').rejects(failure);

      await should(BotOutboxQueueService.processJob([])).be.rejectedWith(
        'storage down'
      );

      should(infoStub.called).be.false();
      should(errorStub.firstCall.args[0]).match(
        /^BotOutboxQueueService: run failed pending=2 oldestSeconds=95 durationMs=\d+$/
      );
      should(errorStub.firstCall.args[1]).equal(failure);
    });

    it('still reports the failure when the outbox cannot be read', async () => {
      sinon.stub(BotOutboxService, 'run').rejects(new Error('storage down'));
      backlogStub.rejects(new Error('database unreachable'));

      await should(BotOutboxQueueService.processJob([])).be.rejectedWith(
        'storage down'
      );

      should(errorStub.firstCall.args[0]).match(
        /run failed pending=-1 oldestSeconds=-1 /
      );
    });
  });
});
