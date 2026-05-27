/**
 * BlacklistService.js
 *
 * @description :: Manages an iat-based token blacklist. Stores a per-user
 *                 `revoked_before` timestamp; tokens with iat < revoked_before
 *                 are considered revoked. Backed by t_token_blacklist in
 *                 PostgreSQL, with an in-memory Map cache for O(1) lookups.
 */

const cache = new Map(); // Map<number, Date>

module.exports = {
  /**
   * Record a revocation for a caver. All tokens issued before now are invalid.
   * Performs an UPSERT on t_token_blacklist, then updates the in-memory cache.
   * If the DB write fails, the cache is NOT updated and the error propagates.
   * @param {number} caverId
   * @returns {Promise<void>}
   */
  async revoke(caverId) {
    const result = await CommonService.query(
      `INSERT INTO t_token_blacklist (id_caver, revoked_before)
       VALUES ($1, NOW())
       ON CONFLICT (id_caver)
       DO UPDATE SET revoked_before = NOW()
       RETURNING revoked_before`,
      [caverId]
    );
    const revokedBefore = new Date(result.rows[0].revoked_before);
    cache.set(caverId, revokedBefore);
    sails.log.info(
      `TokenBlacklist revoked tokens for caver ${caverId} (revoked_before=${revokedBefore.getTime()})`
    );
  },

  /**
   * Check whether a token is revoked.
   *
   * IMPORTANT: This check uses an in-memory cache that is populated at
   * bootstrap from t_token_blacklist. In a multi-instance deployment,
   * a revocation triggered on instance A will NOT propagate to instance B
   * until B restarts (or its cache is refreshed). With the admin token TTL
   * of 10 days, this means a revoked admin token could remain valid on
   * other instances for up to 10 days. This is a known limitation tracked
   * for future improvement (e.g., Redis pub/sub or periodic cache refresh).
   *
   * @param {number} caverId
   * @param {number} iat - Unix timestamp (seconds) from the JWT's iat claim
   * @returns {boolean} true if the token is revoked
   */
  isRevoked(caverId, iat) {
    const revokedBefore = cache.get(caverId);
    if (!revokedBefore) return false;
    return iat < Math.ceil(revokedBefore.getTime() / 1000);
  },

  /**
   * Load all rows from t_token_blacklist into the in-memory cache.
   * Called once during bootstrap.
   * @returns {Promise<void>}
   */
  async loadCache() {
    const startTime = Date.now();
    const result = await CommonService.query(
      'SELECT id_caver, revoked_before FROM t_token_blacklist'
    );
    cache.clear();
    result.rows.forEach((row) => {
      cache.set(row.id_caver, new Date(row.revoked_before));
    });
    const elapsed = Date.now() - startTime;
    sails.log.info(
      `TokenBlacklist loaded ${cache.size} entries in ${elapsed}ms`
    );
  },

  /**
   * Exposed for testing only. Returns the internal cache Map.
   * @returns {Map<number, Date>}
   */
  getCache() {
    return cache;
  },
};
