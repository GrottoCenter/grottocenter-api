\c postgres;

-- Schedules the daily refresh of v_bibliographic_metadata (issue #2061). Until
-- now nothing refreshed it, so OAI and Z39.50 served a catalogue frozen at the
-- last migration. Same job as in sql/1_cron.sql, which only runs on a fresh
-- volume: production gets it from this file.
--
-- Runs in the `postgres` database, as the role that owns the cron jobs (see
-- sql/9_44_2026_11_26_cron_read_for_api.sql). cron.schedule_in_database with an
-- existing name updates that job, so this is idempotent.
--
-- The REFRESH is CONCURRENTLY (unique index idx_v_biblio_id), so readers are
-- not blocked. 03:40 UTC avoids the 04:20-05:10 window and Azure's Saturday
-- 03:00 maintenance. The job name must match CRON_JOBS in
-- api/utils/cronHeartbeat.js.
--
-- The view is stale until the first run: to catch up at once, run the REFRESH
-- CONCURRENTLY by hand, never a plain one (exclusive lock, readers time out).
-- Additive: apply it before or after the deploy.
SELECT cron.schedule_in_database(
    'Refresh bibliographic metadata view daily',
    '40 3 * * *',
    $$
        REFRESH MATERIALIZED VIEW CONCURRENTLY v_bibliographic_metadata;
    $$,
    'grottoce'
);
