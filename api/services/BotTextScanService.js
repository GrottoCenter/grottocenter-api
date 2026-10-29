/**
 * BotTextScanService.js
 *
 * @description :: Step 2 of the nightly bot-surface pipeline, before admission. Runs the
 *   coordinate detector over every free text the bot pages publish
 *   (descriptions and names) and records the verdict in t_bot_text_scan, so
 *   that a text holding a position is withheld from the pages.
 *
 * It never writes to the text tables: their history, change-log and search
 * triggers must not fire for data nobody edited.
 *
 * Fails closed:
 *   - the detector throws on a text: the text is recorded as matched, with the
 *     pattern id `error`, and the run goes on;
 *   - anything else fails (a query, a write): the call rejects, so the
 *     pipeline stops before publishing, and t_bot_config.pattern_version is
 *     left alone.
 *
 * A text is scanned again when it has no verdict, when its hash differs from
 * the verdict's (it was edited), or when the verdict was made with another
 * pattern set version. t_bot_config.pattern_version moves to the current
 * version only once every text has a verdict at that version: until then the
 * admission function and the view count no text, so a scan interrupted half
 * way never lets an unscanned text through.
 */

const coordinateDetector = require('../utils/coordinateDetector');

const DEFAULT_BATCH_SIZE = 1000;

// A text created or edited while a pass runs is picked up by the next pass. A
// handful of passes settles any realistic edit rate; if it does not settle, the
// run fails rather than moving the version over texts without a verdict.
const MAX_PASSES = 3;

// The hash of a text is computed by the database, with the same expression the
// admission function uses to check that a verdict covers the text as it is now.
const SOURCES = [
  {
    table: 't_description',
    hash: "md5(COALESCE(t.title, '') || E'\\n' || COALESCE(t.body, ''))",
    columns: 't.title, t.body',
    live: "t.is_deleted = false AND (btrim(COALESCE(t.title, '')) <> '' OR btrim(COALESCE(t.body, '')) <> '')",
    // A match in the title or in the body withholds the whole description
    textOf: (row) => [row.title, row.body].filter(Boolean).join('\n'),
  },
  {
    table: 't_name',
    hash: "md5(COALESCE(t.name, ''))",
    columns: 't.name',
    live: "t.is_deleted = false AND btrim(COALESCE(t.name, '')) <> ''",
    textOf: (row) => row.name,
  },
];

// versionParam is the placeholder holding the pattern set version, e.g. '$2'
const pendingFilter = (source, versionParam) => `
  ${source.live}
  AND (
    s.source_id IS NULL
    OR s.pattern_version <> ${versionParam}
    OR s.body_hash <> ${source.hash}
  )`;

const countPending = async (patternVersion) => {
  let total = 0;
  for (const source of SOURCES) {
    // eslint-disable-next-line no-await-in-loop
    const { rows } = await CommonService.query(
      `SELECT count(*)::int AS n
       FROM ${source.table} t
       LEFT JOIN t_bot_text_scan s
         ON s.source_table = '${source.table}' AND s.source_id = t.id
       WHERE ${pendingFilter(source, '$1')}`,
      [patternVersion]
    );
    total += rows[0].n;
  }
  return total;
};

module.exports = {
  /**
   * Scans every text that has no up-to-date verdict.
   *
   * @param {object} [options]
   * @param {number} [options.batchSize] rows read and written per round trip
   * @param {Function} [options.detect] detector, for tests
   * @param {number} [options.patternVersion] pattern set version, for tests
   * @returns {Promise<{ patternVersion: number, scanned: Object<string, number>, quarantined: Object<string, number>, errors: number, passes: number, durationMs: number }>}
   *   `scanned` and `quarantined` count distinct texts per source: a text read
   *   again in a later pass counts once, with its latest verdict.
   */
  async run(options = {}) {
    const startedAt = Date.now();
    const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    const detect = options.detect ?? coordinateDetector.detect;
    const patternVersion =
      options.patternVersion ?? coordinateDetector.PATTERN_SET_VERSION;

    const {
      rows: [{ started }],
    } = await CommonService.query('SELECT clock_timestamp() AS started');
    const runStartedAt = started;

    const summary = {
      patternVersion,
      scanned: {},
      quarantined: {},
      errors: 0,
      passes: 0,
      durationMs: 0,
    };
    SOURCES.forEach((source) => {
      summary.scanned[source.table] = 0;
      summary.quarantined[source.table] = 0;
    });

    for (let pass = 1; ; pass += 1) {
      summary.passes = pass;
      for (const source of SOURCES) {
        let lastId = 0;
        for (;;) {
          // eslint-disable-next-line no-await-in-loop
          const { rows } = await CommonService.query(
            `SELECT t.id, ${source.columns}, ${source.hash} AS body_hash,
                  s.matched AS previous_matched, s.scanned_at >= $4 AS rescanned
           FROM ${source.table} t
           LEFT JOIN t_bot_text_scan s
             ON s.source_table = '${source.table}' AND s.source_id = t.id
           WHERE t.id > $1 AND ${pendingFilter(source, '$2')}
           ORDER BY t.id
           LIMIT $3`,
            [lastId, patternVersion, batchSize, runStartedAt]
          );
          if (rows.length === 0) break;

          const verdicts = rows.map((row) => {
            try {
              const result = detect(source.textOf(row));
              return result.matched
                ? {
                    row,
                    matched: true,
                    id: result.patternId,
                    excerpt: result.match,
                  }
                : { row, matched: false, id: null, excerpt: null };
            } catch (error) {
              summary.errors += 1;
              sails.log.error(
                `bot-text-scan: the detector failed on ${source.table} ${row.id}, withholding it`,
                error
              );
              return { row, matched: true, id: 'error', excerpt: null };
            }
          });

          // eslint-disable-next-line no-await-in-loop
          await CommonService.query(
            `INSERT INTO t_bot_text_scan
             (source_table, source_id, body_hash, pattern_version, matched, pattern_id, match_excerpt, scanned_at)
           SELECT '${source.table}', v.id, v.body_hash, $1, v.matched, v.pattern_id, v.excerpt, now()
           FROM unnest($2::int[], $3::text[], $4::boolean[], $5::text[], $6::text[])
             AS v(id, body_hash, matched, pattern_id, excerpt)
           ON CONFLICT (source_table, source_id) DO UPDATE SET
             body_hash = EXCLUDED.body_hash,
             pattern_version = EXCLUDED.pattern_version,
             matched = EXCLUDED.matched,
             pattern_id = EXCLUDED.pattern_id,
             match_excerpt = EXCLUDED.match_excerpt,
             scanned_at = EXCLUDED.scanned_at`,
            [
              patternVersion,
              verdicts.map((v) => v.row.id),
              verdicts.map((v) => v.row.body_hash),
              verdicts.map((v) => v.matched),
              verdicts.map((v) => v.id),
              verdicts.map((v) => v.excerpt),
            ]
          );

          // Counts are of distinct texts: a text this run already wrote a
          // verdict for (edited mid-scan, so read again) replaces its earlier
          // verdict instead of adding to it.
          verdicts.forEach((v) => {
            if (!v.row.rescanned) summary.scanned[source.table] += 1;
            summary.quarantined[source.table] +=
              (v.matched ? 1 : 0) -
              (v.row.previous_matched && v.row.rescanned ? 1 : 0);
          });
          lastId = rows[rows.length - 1].id;
        }
      }

      // Every text must have a verdict at this version before the version moves
      // eslint-disable-next-line no-await-in-loop
      const pending = await countPending(patternVersion);
      if (pending === 0) break;
      if (pass === MAX_PASSES) {
        throw new Error(
          `bot-text-scan: ${pending} texts still have no verdict at version ${patternVersion} after ${MAX_PASSES} passes`
        );
      }
    }

    const updated = await CommonService.query(
      'UPDATE t_bot_config SET pattern_version = $1 WHERE id = 1',
      [patternVersion]
    );
    if (updated.rowCount !== 1) {
      throw new Error('bot-text-scan: t_bot_config has no row to update');
    }

    summary.durationMs = Date.now() - startedAt;
    sails.log.info(
      `bot-text-scan: version ${patternVersion}, scanned ${JSON.stringify(
        summary.scanned
      )}, quarantined ${JSON.stringify(summary.quarantined)}, detector errors ${
        summary.errors
      } in ${summary.passes} pass(es), ${summary.durationMs} ms`
    );
    return summary;
  },
};
