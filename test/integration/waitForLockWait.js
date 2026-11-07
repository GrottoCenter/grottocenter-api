const CommonService = require('../../api/services/CommonService');

/**
 * Wait until a backend of the current database waits for a lock: a request
 * started concurrently with a transaction that holds a row lock has reached
 * that lock. Polled on a connection of its own, outside any transaction.
 *
 * @param {number} [timeoutMs]
 * @returns {Promise<void>} rejects when no backend waits within the timeout
 */
const waitForLockWait = async (timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs;
  const poll = async () => {
    const { rows } = await CommonService.query(
      `SELECT count(*)::int AS waiting FROM pg_stat_activity
       WHERE datname = current_database() AND wait_event_type = 'Lock'`,
      []
    );
    if (rows[0].waiting > 0) return;
    if (Date.now() > deadline) {
      throw new Error(`No transaction waited for a lock in ${timeoutMs} ms`);
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    await poll();
  };
  await poll();
};

module.exports = waitForLockWait;
