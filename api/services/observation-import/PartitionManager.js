/**
 * PartitionManager.js
 *
 * Ensures that PostgreSQL quarterly partitions exist for t_measurement before
 * bulk-inserting rows. This is called early in the EntityBuilder transaction
 * so that INSERT statements never fail due to missing partitions.
 *
 * Partition naming convention matches the DDL in sql/9_04_scientific_observations_ddl.sql:
 *   t_measurement_<year>_q<quarter>
 *
 * Uses CREATE TABLE IF NOT EXISTS … PARTITION OF, which is idempotent — safe
 * for concurrent imports and repeated calls with overlapping date ranges.
 *
 * Design decisions:
 *   - Runs inside the caller's transaction (receives the `db` connection).
 *   - Deduplicates quarters before issuing DDL to minimize round-trips.
 *   - Accepts raw Date objects (UTC) produced by TimestampConverter.
 *   - Pure derivation logic (extractQuarters) is separated from the IO
 *     function (ensurePartitions) for testability.
 */

// ---------------------------------------------------------------------------
// Quarter derivation (pure)
// ---------------------------------------------------------------------------

/**
 * Derives the unique set of { year, quarter } pairs required to cover the
 * given timestamps.
 *
 * @param {Date[]} timestamps - Array of UTC Date objects.
 * @returns {Array<{ year: number, quarter: number }>}
 *   Deduplicated, sorted ascending by year then quarter.
 */
const extractQuarters = (timestamps) => {
  const seen = new Set();
  const quarters = [];

  for (const ts of timestamps) {
    const year = ts.getUTCFullYear();
    const quarter = Math.ceil((ts.getUTCMonth() + 1) / 3);
    const key = `${year}_q${quarter}`;

    if (!seen.has(key)) {
      seen.add(key);
      quarters.push({ year, quarter });
    }
  }

  // Sort for deterministic DDL ordering (useful in logs and tests)
  quarters.sort((a, b) => a.year - b.year || a.quarter - b.quarter);

  return quarters;
};

// ---------------------------------------------------------------------------
// Partition boundary computation (pure)
// ---------------------------------------------------------------------------

/**
 * Computes the [start, end) date boundaries for a given quarter.
 *
 * @param {number} year    - Four-digit year.
 * @param {number} quarter - 1–4.
 * @returns {{ start: string, end: string }}
 *   ISO date strings (YYYY-MM-DD) representing the half-open interval
 *   [start, end) used by PostgreSQL RANGE partitioning.
 */
const computeBoundaries = (year, quarter) => {
  const startMonth = (quarter - 1) * 3; // 0-indexed month (0, 3, 6, 9)

  // Start: first day of the quarter
  const startDate = new Date(Date.UTC(year, startMonth, 1));

  // End: first day of the next quarter (exclusive boundary)
  const endDate = new Date(Date.UTC(year, startMonth + 3, 1));

  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
  };
};

// ---------------------------------------------------------------------------
// Partition creation (IO)
// ---------------------------------------------------------------------------

/**
 * Ensures that a quarterly partition exists for every quarter spanned by the
 * provided timestamps. Issues one DDL statement per missing quarter.
 *
 * Must be called within a transaction (pass the `db` connection). DDL inside
 * a transaction takes a brief ACCESS EXCLUSIVE lock on the parent table, but
 * observation imports are infrequent and serialized, making this acceptable.
 *
 * @param {Date[]} timestamps - UTC Date objects from TimestampConverter.
 * @param {*} db              - Waterline/Knex transaction connection.
 * @returns {Promise<string[]>}
 *   Names of partitions that were created (or already existed). Useful for
 *   logging and testing.
 */
const ensurePartitions = async (timestamps, db) => {
  if (!timestamps || timestamps.length === 0) {
    return [];
  }

  const quarters = extractQuarters(timestamps);
  const partitionNames = [];

  for (const { year, quarter } of quarters) {
    const partitionName = `t_measurement_${year}_q${quarter}`;
    const { start, end } = computeBoundaries(year, quarter);

    // CREATE TABLE IF NOT EXISTS is idempotent — no error if partition exists.
    // Using identifier quoting (%I equivalent) is unnecessary here because
    // partition names are derived from integers, making injection impossible.
    // eslint-disable-next-line no-await-in-loop
    await CommonService.query(
      `CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF t_measurement FOR VALUES FROM ('${start}') TO ('${end}')`,
      [],
      db
    );

    partitionNames.push(partitionName);
  }

  if (partitionNames.length > 0) {
    sails.log.info(
      `PartitionManager: ensured ${partitionNames.length} partition(s): ${partitionNames.join(', ')}`
    );
  }

  return partitionNames;
};

module.exports = {
  extractQuarters,
  computeBoundaries,
  ensurePartitions,
};
