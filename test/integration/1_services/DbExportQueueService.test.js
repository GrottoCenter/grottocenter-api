const should = require('should');
const sinon = require('sinon');

describe('DbExportQueueService', () => {
  let DbExportQueueService;
  let dbExport;
  let originalBoss;

  before(() => {
    /* eslint-disable global-require */
    DbExportQueueService = require('../../../api/services/DbExportQueueService');
    dbExport = require('../../../api/dbSync/dbExport');
    /* eslint-enable global-require */
    originalBoss = sails.enrichmentBoss;
  });

  afterEach(() => {
    sails.enrichmentBoss = originalBoss;
    sinon.restore();
  });

  describe('start()', () => {
    it('creates an exclusive queue, schedules it weekly and registers its worker', async () => {
      const boss = {
        createQueue: sinon.stub().resolves(),
        schedule: sinon.stub().resolves(),
        work: sinon.stub().resolves('worker-id'),
      };
      sails.enrichmentBoss = boss;

      await DbExportQueueService.start();

      should(boss.createQueue.calledOnce).be.true();
      const [queueName, queueOptions] = boss.createQueue.firstCall.args;
      should(queueName).equal('db-export');
      should(queueOptions).have.properties({
        policy: 'exclusive',
        retryLimit: 1,
      });
      // Long enough for an export, short enough not to block the queue for hours
      should(queueOptions.expireInSeconds).be.within(30 * 60, 60 * 60);

      should(boss.schedule.calledOnce).be.true();
      should(boss.schedule.firstCall.args).eql([
        'db-export',
        '0 3 * * 0',
        null,
        { tz: 'UTC', missed: 'once' },
      ]);

      should(boss.work.calledOnce).be.true();
      should(boss.work.firstCall.args[0]).equal('db-export');
      should(boss.work.firstCall.args[1]).equal(
        DbExportQueueService.processJob
      );
      // The queue exists before anything is scheduled or worked on it
      should(boss.createQueue.calledBefore(boss.schedule)).be.true();
      should(boss.createQueue.calledBefore(boss.work)).be.true();
    });

    it('does nothing when pg-boss is not available', async () => {
      sails.enrichmentBoss = null;
      await should(DbExportQueueService.start()).be.fulfilled();
    });
  });

  describe('processJob()', () => {
    it('runs the export', async () => {
      const exportStub = sinon.stub(dbExport, 'makeDbExport').resolves();
      await DbExportQueueService.processJob([{ id: 'job' }]);
      should(exportStub.calledOnce).be.true();
    });

    it('rethrows an export failure so pg-boss retries the job', async () => {
      sinon.stub(dbExport, 'makeDbExport').rejects(new Error('export failed'));
      await should(DbExportQueueService.processJob([])).be.rejectedWith(
        'export failed'
      );
    });
  });
});
