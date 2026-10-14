// Serializes the search writes that build documents from the database and then
// import them: a reconciliation page and an outbox chunk. Without it, one of
// them could import the version it built before the other imported a newer
// one, and the index would keep the older version until the row changes again.
//
// A session-level advisory lock on a leased connection: no transaction is held
// open while Typesense is called.

const CommonService = require('../services/CommonService');

// Any key no other advisory lock uses
const LOCK_KEY = 1871;
// Postgres: canceling statement due to lock timeout
const LOCK_NOT_AVAILABLE = '55P03';

// A native query error wraps the driver's: OperationalError → cause → raw.error
const isLockTimeout = (err) =>
  [err, err?.cause].some(
    (e) =>
      e?.raw?.error?.code === LOCK_NOT_AVAILABLE ||
      e?.raw?.code === LOCK_NOT_AVAILABLE
  );

/**
 * Run `fn` holding the search write lock.
 *
 * @param {Function} fn async, called without arguments
 * @param {Object} [options]
 * @param {number} [options.timeoutMs] how long to wait for the lock; waits as
 *   long as it takes when absent
 * @returns {Promise<*>} what `fn` returns
 * @throws an error with `code: 'E_SEARCH_LOCK_TIMEOUT'` when the lock was not
 *   acquired in time, in which case `fn` is not called
 */
async function withSearchWriteLock(fn, { timeoutMs } = {}) {
  return sails.getDatastore().leaseConnection(async (db) => {
    // 0 disables lock_timeout: a positive wait stays positive
    const wait =
      timeoutMs === undefined ? 0 : Math.max(1, Math.ceil(timeoutMs));
    await CommonService.query(`SET lock_timeout = ${wait}`, [], db);
    try {
      await CommonService.query('SELECT pg_advisory_lock($1)', [LOCK_KEY], db);
    } catch (err) {
      if (!isLockTimeout(err)) throw err;
      throw Object.assign(new Error('Search write lock not acquired in time'), {
        code: 'E_SEARCH_LOCK_TIMEOUT',
      });
    } finally {
      // The connection goes back to the pool: leave no setting behind
      await CommonService.query('RESET lock_timeout', [], db);
    }
    try {
      return await fn();
    } finally {
      await CommonService.query(
        'SELECT pg_advisory_unlock($1)',
        [LOCK_KEY],
        db
      );
    }
  });
}

module.exports = { withSearchWriteLock, LOCK_KEY };
