\c postgres;

-- Lets the API role read the run history of the pg_cron jobs (issue #2029), so
-- that a pg-boss job can report them to one heartbeat monitor
-- (api/services/CronHeartbeatQueueService.js).
--
-- pg_cron lives in the `postgres` database (cron.database_name), not in
-- `grottoce`, so this runs in `postgres` and the API opens a second connection
-- to it. A grant on the cron schema is NOT enough: cron.job and
-- cron.job_run_details have row-level security (`username = CURRENT_USER`), so
-- a role only sees the jobs it owns, and gc_app owns none (on prod they belong
-- to `grottoce`). The function below runs as its owner, which must therefore be
-- the role that owns the jobs: apply this migration with that role, as
-- sql/1_cron.sql does. It exposes four columns of the latest run per job and
-- nothing else (no command, no return message).
--
-- This is the one object not owned by gc_owner: the owner has to be the cron
-- job owner for the policy to let the function see the jobs.
--
-- Idempotent. Additive: apply it BEFORE deploying the API that calls it.
CREATE OR REPLACE FUNCTION public.gc_cron_latest_runs()
RETURNS TABLE (
    jobname text,
    status text,
    start_time timestamptz,
    end_time timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT DISTINCT ON (j.jobname)
           j.jobname::text, d.status::text, d.start_time, d.end_time
      FROM cron.job j
      LEFT JOIN cron.job_run_details d ON d.jobid = j.jobid
     ORDER BY j.jobname, d.runid DESC NULLS LAST
$$;

REVOKE ALL ON FUNCTION public.gc_cron_latest_runs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gc_cron_latest_runs() TO gc_app;
