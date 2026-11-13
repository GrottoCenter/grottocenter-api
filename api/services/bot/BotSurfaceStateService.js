/**
 * BotSurfaceStateService.js
 *
 * @description :: The publishing switch of the bot surface (#1887, #1888):
 *   the single row of t_bot_surface_state
 *   (sql/9_40_2026_11_09_bot_surface_state.sql).
 *
 *   publishing = true   the page generator, the sitemaps and the withdrawal
 *                       worker upload pages.
 *   publishing = false  none of them uploads anything; they still delete.
 *                       A page that would need an upload (new, or changed so
 *                       that its hash differs) is deleted instead, because a
 *                       changed page may be the reduced version of a
 *                       withdrawal and the stale one must not stay online; an
 *                       unchanged page stays. The nightly audit (#1887) sets
 *                       it to false when a run finds too many bad pages; an
 *                       operator sets it back (docs/bot-surface.md).
 *
 * FAIL CLOSED: a missing row, or a table that cannot be read (migration not
 * applied, database error), reads as publishing = false, and is logged.
 */

const query = (sql, params) => CommonService.query(sql, params);

const REASON_MAX_LENGTH = 2000;

module.exports = {
  /**
   * @returns {Promise<{publishing: boolean, reason: ?string, updatedAt: ?Date,
   *   failedClosed: boolean}>} `failedClosed` is true when the state could not
   *   be read and publishing was therefore reported as false
   */
  async read() {
    try {
      const { rows } = await query(
        'SELECT publishing, reason, updated_at FROM t_bot_surface_state WHERE id = 1'
      );
      if (rows.length === 0) {
        sails.log.error(
          'bot-surface-state: t_bot_surface_state has no row, publishing is treated as OFF (fail closed); insert it with INSERT INTO t_bot_surface_state (id) VALUES (1) ON CONFLICT DO NOTHING'
        );
        return {
          publishing: false,
          reason: 'no row in t_bot_surface_state',
          updatedAt: null,
          failedClosed: true,
        };
      }
      return {
        publishing: rows[0].publishing === true,
        reason: rows[0].reason,
        updatedAt: rows[0].updated_at,
        failedClosed: false,
      };
    } catch (err) {
      sails.log.error(
        `bot-surface-state: cannot read t_bot_surface_state, publishing is treated as OFF (fail closed): ${err.message}`,
        err
      );
      return {
        publishing: false,
        reason: 't_bot_surface_state is unreadable',
        updatedAt: null,
        failedClosed: true,
      };
    }
  },

  /** Whether uploads are allowed. False when the state cannot be read. */
  async isPublishing() {
    return (await module.exports.read()).publishing;
  },

  /**
   * Stops uploads. Creates the row when it is missing.
   *
   * @param {string} reason why; kept in the row for the operator
   */
  async stopPublishing(reason) {
    await query(
      `INSERT INTO t_bot_surface_state (id, publishing, reason, updated_at)
       VALUES (1, false, $1, now())
       ON CONFLICT (id) DO UPDATE
         SET publishing = false, reason = EXCLUDED.reason, updated_at = now()`,
      [String(reason).slice(0, REASON_MAX_LENGTH)]
    );
  },
};
