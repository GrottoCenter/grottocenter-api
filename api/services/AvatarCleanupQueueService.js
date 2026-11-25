/**
 * AvatarCleanupQueueService.js
 *
 * @description :: Schedules the hourly retry of avatar deletions (#1730) on
 *   the shared pg-boss instance. An image whose deletion failed, or whose
 *   upload was interrupted, stays recorded in t_avatar_pending_deletion
 *   (AvatarService): this job deletes it once storage answers again. The
 *   `exclusive` policy keeps at most one run queued or running across all API
 *   instances.
 */

const { withHeartbeat } = require('../utils/heartbeat');

const QUEUE_NAME = 'avatar-cleanup';
// Every hour, at minute 23
const CRON = '23 * * * *';
const QUEUE_OPTIONS = {
  policy: 'exclusive',
  expireInSeconds: 30 * 60,
  retryLimit: 0,
};

const HEARTBEAT = {
  name: 'avatar-cleanup',
  getUrl: () => sails.config.custom.heartbeats.avatarCleanup,
};

module.exports = {
  QUEUE_NAME,
  HEARTBEAT,
  CRON,
  QUEUE_OPTIONS,

  /**
   * Create the avatar-cleanup queue, register its schedule and its worker.
   * Called from bootstrap.js after pg-boss is started.
   */
  async start() {
    const boss = sails.enrichmentBoss;
    if (!boss) {
      sails.log.warn(
        'AvatarCleanupQueueService: pg-boss not available, skipping'
      );
      return;
    }
    await boss.createQueue(QUEUE_NAME, QUEUE_OPTIONS);
    await boss.schedule(QUEUE_NAME, CRON, null, { tz: 'UTC' });
    await boss.work(QUEUE_NAME, module.exports.processJob);
    sails.log.info('AvatarCleanupQueueService: started and listening for jobs');
  },

  /**
   * Retry the recorded deletions. A run that cannot reach storage leaves the
   * paths recorded for the next one, so it does not fail the job.
   */
  async processJob() {
    const result = await sails.services.avatarservice.retryPendingDeletions();
    if (result.deleted || result.failed || result.kept) {
      sails.log.info(`avatar-cleanup: ${JSON.stringify(result)}`);
    }
    return result;
  },
};

// Report each run to the job's heartbeat monitor (docs/agents/scheduled-jobs.md).
// Wrapped after the definition so that start() registers the wrapped handler.
module.exports.processJob = withHeartbeat(
  module.exports.processJob,
  module.exports.HEARTBEAT
);
