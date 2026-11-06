\c grottoce;

-- =============================================================================
-- #1760: t_bot_pipeline_run, one row per run of the nightly bot-surface pipeline
-- =============================================================================
--
-- Written by api/services/bot/BotPipelineService.js: a row is inserted when a run
-- starts ('running') and completed when it ends.
--
--   id              serial
--   started_at      when the run started
--   finished_at     when it ended; NULL while it runs
--   status          'running', 'succeeded' or 'failed'. A 'running' row whose
--                   process died is marked 'failed' (error 'abandoned') by the
--                   next run
--   failed_step     the step that failed (1 invariant check, 2 text scan,
--                   3 admission, 4 generation, 5 sitemaps, 6 audit); NULL when
--                   the run did not fail
--   step_durations  jsonb, milliseconds by step name
--   counts          jsonb: what the steps did (admitted, texts scanned and
--                   quarantined per source, pages per type, uploaded / deleted
--                   / unchanged, sitemap URLs and shards, peak RSS, audit)
--   error           the message of the failure; NULL otherwise
--
-- Retention: the pipeline deletes the rows older than one year at the start of
-- each run.
--
-- "No successful run in 26 hours":
--   SELECT max(finished_at) < now() - interval '26 hours' OR max(finished_at) IS NULL
--     FROM t_bot_pipeline_run WHERE status = 'succeeded';
--
-- Production does not run migrations on deploy: apply this file by hand.
-- Idempotent.
-- =============================================================================

CREATE TABLE IF NOT EXISTS t_bot_pipeline_run (
  id serial PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status varchar(16) NOT NULL DEFAULT 'running',
  failed_step smallint,
  step_durations jsonb NOT NULL DEFAULT '{}'::jsonb,
  counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  CONSTRAINT t_bot_pipeline_run_status_check
    CHECK (status IN ('running', 'succeeded', 'failed')),
  CONSTRAINT t_bot_pipeline_run_failed_step_check
    CHECK (failed_step IS NULL OR failed_step BETWEEN 1 AND 6)
);
ALTER TABLE t_bot_pipeline_run OWNER TO gc_owner;

CREATE INDEX IF NOT EXISTS t_bot_pipeline_run_started_at_idx
  ON t_bot_pipeline_run (started_at DESC);
