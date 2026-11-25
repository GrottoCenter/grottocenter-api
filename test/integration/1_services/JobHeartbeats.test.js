const should = require('should');

// Every scheduled pg-boss job reports to its own heartbeat monitor
// (docs/agents/scheduled-jobs.md). The behaviour is tested in 2_utils/heartbeat;
// this checks the wiring: each service's handler is wrapped, with its own config key.
const JOBS = [
  ['SearchOutboxQueueService', 'search-outbox', 'searchOutbox', 300000],
  ['BotOutboxQueueService', 'bot-outbox', 'botOutbox', 300000],
  ['AvatarCleanupQueueService', 'avatar-cleanup', 'avatarCleanup', 0],
  ['BotPipelineQueueService', 'bot-surface-nightly', 'botPipeline', 0],
  ['DbExportQueueService', 'db-export', 'dbExport', 0],
  ['SearchReconcileQueueService', 'search-reconcile', 'searchReconcile', 0],
];

describe('Scheduled job heartbeats', () => {
  let heartbeats;

  before(() => {
    ({ heartbeats } = sails.config.custom);
  });

  it('declares one distinct key per job', () => {
    should(Object.keys(heartbeats).sort()).eql(JOBS.map((j) => j[2]).sort());
  });

  JOBS.forEach(([service, name, key, minIntervalMs]) => {
    describe(service, () => {
      let original;

      beforeEach(() => {
        original = heartbeats[key];
      });
      afterEach(() => {
        heartbeats[key] = original;
      });

      it(`reports as ${name}, from config.custom.heartbeats.${key}`, () => {
        const { HEARTBEAT } = sails.services[service.toLowerCase()];
        should(HEARTBEAT).be.an.Object();
        should(HEARTBEAT.name).equal(name);
        should(HEARTBEAT.minIntervalMs || 0).equal(minIntervalMs);
        heartbeats[key] = 'https://example.test/hb';
        should(HEARTBEAT.getUrl()).equal('https://example.test/hb');
      });
    });
  });
});
