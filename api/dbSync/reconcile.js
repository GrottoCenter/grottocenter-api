// Brings every search collection back in line with the database, in place:
// the safety net behind the outbox (searchOutbox.js) for what no trigger sees
// (reference tables, a data-quality score lowered by a removal…).
//
// Unlike the rebuild (dbSync.js), it writes to the live collections, so a
// real-time write made during the run is not lost to an alias switch. Each
// page is built and imported under the search write lock, so it never
// overwrites a newer version the outbox imported meanwhile.

const CommonService = require('../services/CommonService');
const SearchService = require('../services/SearchService');
const typesense = require('../../config/typesense');
const { ENTITIES, getEntity } = require('./searchDocuments');
const { withSearchWriteLock } = require('./searchWriteLock');

const PAGE_SIZE = 1000;

// Every search collection: a new one is reconciled as soon as it is indexed.
// The order does not matter in place
const COLLECTIONS = Object.keys(ENTITIES);

const syncUnderLock = (collectionName, ids) =>
  withSearchWriteLock(() => SearchService.syncDocuments(collectionName, ids));

/**
 * Re-index every row of a collection's table, then remove what the index holds
 * for rows that no longer exist.
 *
 * Pages go through syncDocuments, so the rows the collection does not index
 * (soft-deleted, not validated…) are removed from it, and a document pending
 * re-validation keeps its last validated version.
 *
 * @param {string} collectionName
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal] stops the run before the next page
 * @param {number} [options.pageSize]
 * @returns {Promise<{rows: number, orphans: number}>} the table rows synced,
 *   and the indexed ids that had no row
 */
async function reconcileCollection(
  collectionName,
  { signal, pageSize = PAGE_SIZE } = {}
) {
  const { sourceTable } = getEntity(collectionName);
  const seen = new Set();
  let lastId = 0;
  for (;;) {
    signal?.throwIfAborted();
    // Keyset paging: the cost of a page does not grow with its position
    // eslint-disable-next-line no-await-in-loop
    const { rows } = await CommonService.query(
      `SELECT id FROM ${sourceTable} WHERE id > $1 ORDER BY id LIMIT $2`,
      [lastId, pageSize]
    );
    if (rows.length === 0) break;
    const ids = rows.map((r) => r.id);
    // eslint-disable-next-line no-await-in-loop
    await syncUnderLock(collectionName, ids);
    ids.forEach((id) => seen.add(id));
    lastId = ids.at(-1);
  }

  // Ids indexed without a row when their page was read: syncDocuments checks
  // them again, so a row created since then is indexed rather than removed
  const orphans = (await typesense.exportIds(collectionName)).filter(
    (id) => !seen.has(id)
  );
  for (let i = 0; i < orphans.length; i += pageSize) {
    signal?.throwIfAborted();
    // eslint-disable-next-line no-await-in-loop
    await syncUnderLock(collectionName, orphans.slice(i, i + pageSize));
  }
  return { rows: seen.size, orphans: orphans.length };
}

/**
 * Reconcile every search collection. One failing collection does not stop the
 * others; the run then throws once they are all done, so the job is recorded
 * as failed. An aborted signal stops the run at once.
 *
 * @param {Object} [options] see reconcileCollection
 */
async function reconcile(options = {}) {
  const startTime = Date.now();
  sails.log.info('[reconcile] Start search reconciliation');
  const failed = [];
  for (const collectionName of COLLECTIONS) {
    const collectionStart = Date.now();
    try {
      // eslint-disable-next-line no-await-in-loop
      const { rows, orphans } = await reconcileCollection(
        collectionName,
        options
      );
      sails.log.info(
        `[reconcile] ${collectionName}: ${rows} rows synced, ${orphans} orphans checked in ${
          Date.now() - collectionStart
        }ms`
      );
    } catch (err) {
      if (options.signal?.aborted) throw err;
      sails.log.error(`[reconcile] Error reconciling ${collectionName}`, err);
      failed.push(collectionName);
    }
  }
  sails.log.info(
    `[reconcile] Done search reconciliation in ${Date.now() - startTime}ms`
  );
  if (failed.length > 0) {
    throw new Error(`Search reconciliation failed for ${failed.join(', ')}`);
  }
}

module.exports = { reconcile, reconcileCollection, COLLECTIONS };
