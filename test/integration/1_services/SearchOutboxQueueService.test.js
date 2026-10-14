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
      // Longer than the 10-minute drain budget
      should(queueOptions.expireInSeconds).be.above(10 * 60);

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
    it('drains the outbox, watching the job signal', async () => {
      const drainStub = sinon.stub(searchOutbox, 'drain').resolves(3);
      const { signal } = new AbortController();
      await SearchOutboxQueueService.processJob([{ id: 'job', signal }]);
      should(drainStub.calledOnce).be.true();
      should(drainStub.firstCall.args[0].signal).equal(signal);
    });

    it('rethrows a drain failure so pg-boss records it', async () => {
      sinon.stub(searchOutbox, 'drain').rejects(new Error('drain failed'));
      await should(SearchOutboxQueueService.processJob([])).be.rejectedWith(
        'drain failed'
      );
    });
  });
});
