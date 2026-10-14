const should = require('should');
const sinon = require('sinon');

describe('SearchReconcileQueueService', () => {
  let SearchReconcileQueueService;
  let reconcileModule;
  let originalBoss;

  before(() => {
    /* eslint-disable global-require */
    SearchReconcileQueueService = require('../../../api/services/SearchReconcileQueueService');
    reconcileModule = require('../../../api/dbSync/reconcile');
    /* eslint-enable global-require */
    originalBoss = sails.enrichmentBoss;
  });

  afterEach(() => {
    sails.enrichmentBoss = originalBoss;
    sinon.restore();
  });

  describe('start()', () => {
    it('creates an exclusive queue, schedules it monthly and registers its worker', async () => {
      const boss = {
        createQueue: sinon.stub().resolves(),
        schedule: sinon.stub().resolves(),
        work: sinon.stub().resolves('worker-id'),
      };
      sails.enrichmentBoss = boss;

      await SearchReconcileQueueService.start();

      should(boss.createQueue.args).eql([
        [
          'search-reconcile',
          {
            policy: 'exclusive',
            expireInSeconds: 2 * 60 * 60,
            retryLimit: 1,
            retryDelay: 15 * 60,
          },
        ],
      ]);
      // A run missed while every instance was down still happens once
      should(boss.schedule.args).eql([
        ['search-reconcile', '0 2 1 * *', null, { tz: 'UTC', missed: 'once' }],
      ]);
      should(boss.work.args).eql([
        ['search-reconcile', SearchReconcileQueueService.processJob],
      ]);
      should(boss.createQueue.calledBefore(boss.schedule)).be.true();
      should(boss.createQueue.calledBefore(boss.work)).be.true();
    });

    it('does nothing when pg-boss is not available', async () => {
      sails.enrichmentBoss = null;
      await should(SearchReconcileQueueService.start()).be.fulfilled();
    });
  });

  describe('processJob()', () => {
    it('reconciles the index, watching the job signal', async () => {
      const reconcileStub = sinon.stub(reconcileModule, 'reconcile').resolves();
      const { signal } = new AbortController();

      await SearchReconcileQueueService.processJob([{ id: 'job', signal }]);

      should(reconcileStub.calledOnce).be.true();
      should(reconcileStub.firstCall.args[0].signal).equal(signal);
    });

    it('rethrows a failure so pg-boss records it and retries', async () => {
      sinon
        .stub(reconcileModule, 'reconcile')
        .rejects(new Error('reconcile failed'));
      await should(SearchReconcileQueueService.processJob([])).be.rejectedWith(
        'reconcile failed'
      );
    });
  });
});
