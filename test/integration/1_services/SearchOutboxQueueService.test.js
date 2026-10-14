const should = require('should');
const sinon = require('sinon');

describe('SearchOutboxQueueService', () => {
  let SearchOutboxQueueService;
  let searchOutbox;
  let originalBoss;

  before(() => {
    /* eslint-disable global-require */
    SearchOutboxQueueService = require('../../../api/services/SearchOutboxQueueService');
    searchOutbox = require('../../../api/dbSync/searchOutbox');
    /* eslint-enable global-require */
    originalBoss = sails.enrichmentBoss;
  });

  afterEach(() => {
    sails.enrichmentBoss = originalBoss;
    sinon.restore();
  });

  describe('start()', () => {
    it('creates an exclusive queue, schedules it every minute and registers its worker', async () => {
      const boss = {
        createQueue: sinon.stub().resolves(),
        schedule: sinon.stub().resolves(),
        work: sinon.stub().resolves('worker-id'),
      };
      sails.enrichmentBoss = boss;

      await SearchOutboxQueueService.start();

      should(boss.createQueue.calledOnce).be.true();
      const [queueName, queueOptions] = boss.createQueue.firstCall.args;
      should(queueName).equal('search-outbox');
      // No retry: the next run, a minute later, picks up what is left
      should(queueOptions).have.properties({
        policy: 'exclusive',
        retryLimit: 0,
      });
      // The 5-minute drain budget, plus one 8-minute sync started just before
      should(queueOptions.expireInSeconds).be.above(13 * 60);

      should(boss.schedule.calledOnce).be.true();
      should(boss.schedule.firstCall.args).eql([
        'search-outbox',
        '* * * * *',
        null,
        { tz: 'UTC' },
      ]);

      should(boss.work.calledOnce).be.true();
      should(boss.work.firstCall.args[0]).equal('search-outbox');
      should(boss.work.firstCall.args[1]).equal(
        SearchOutboxQueueService.processJob
      );
      should(boss.createQueue.calledBefore(boss.schedule)).be.true();
      should(boss.createQueue.calledBefore(boss.work)).be.true();
    });

    it('does nothing when pg-boss is not available', async () => {
      sails.enrichmentBoss = null;
      await should(SearchOutboxQueueService.start()).be.fulfilled();
    });
  });

  describe('processJob()', () => {
    let backlogStub;
    let infoStub;
    let errorStub;

    beforeEach(() => {
      backlogStub = sinon
        .stub(searchOutbox, 'backlog')
        .resolves({ pending: 2, oldestSeconds: 95 });
      infoStub = sinon.stub(sails.log, 'info');
      errorStub = sinon.stub(sails.log, 'error');
    });

    it('drains the outbox, watching the job signal', async () => {
      const drainStub = sinon.stub(searchOutbox, 'drain').resolves(3);
      const { signal } = new AbortController();
      await SearchOutboxQueueService.processJob([{ id: 'job', signal }]);
      should(drainStub.calledOnce).be.true();
      should(drainStub.firstCall.args[0].signal).equal(signal);
    });

    // The operations workbook parses this line: keep its format
    it('logs one line per run with the changes and what is left', async () => {
      sinon.stub(searchOutbox, 'drain').resolves(3);

      await SearchOutboxQueueService.processJob([]);

      should(infoStub.callCount).equal(1);
      should(infoStub.firstCall.args[0]).match(
        /^SearchOutboxQueueService: run changes=3 pending=2 oldestSeconds=95 durationMs=\d+$/
      );
      should(backlogStub.calledAfter(searchOutbox.drain)).be.true();
    });

    it('logs a run that changed nothing, so a stopped worker shows as a gap', async () => {
      sinon.stub(searchOutbox, 'drain').resolves(0);
      backlogStub.resolves({ pending: 0, oldestSeconds: 0 });

      await SearchOutboxQueueService.processJob([]);

      should(infoStub.firstCall.args[0]).match(
        /^SearchOutboxQueueService: run changes=0 pending=0 oldestSeconds=0 durationMs=\d+$/
      );
    });

    it('logs a failed run, then rethrows it so pg-boss records it', async () => {
      const failure = new Error('drain failed');
      sinon.stub(searchOutbox, 'drain').rejects(failure);

      await should(SearchOutboxQueueService.processJob([])).be.rejectedWith(
        'drain failed'
      );

      should(infoStub.called).be.false();
      should(errorStub.callCount).equal(1);
      should(errorStub.firstCall.args[0]).match(
        /^SearchOutboxQueueService: run failed pending=2 oldestSeconds=95 durationMs=\d+$/
      );
      should(errorStub.firstCall.args[1]).equal(failure);
    });

    it('still reports the drain failure when the outbox cannot be read', async () => {
      sinon.stub(searchOutbox, 'drain').rejects(new Error('drain failed'));
      backlogStub.rejects(new Error('database unreachable'));

      await should(SearchOutboxQueueService.processJob([])).be.rejectedWith(
        'drain failed'
      );

      should(errorStub.firstCall.args[0]).match(
        /run failed pending=-1 oldestSeconds=-1 /
      );
    });
  });
});
