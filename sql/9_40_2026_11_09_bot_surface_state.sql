\c grottoce;

-- =============================================================================
-- #1887 / #1888: t_bot_surface_state, the publishing switch of the bot surface
-- =============================================================================
--
-- One row (id = 1, enforced by the primary key and a CHECK):
--
--   publishing  true: the pipeline and the withdrawal worker upload pages.
--               false: they upload NOTHING and only delete (the nightly audit
--               sets it to false when it finds more than BOT_AUDIT_FAILURE_LIMIT
--               bad pages in one run; an operator can set it by hand to turn
--               the surface off). A page that would need an upload while it is
--               false is deleted instead; an unchanged page stays.
--   reason      why it was set to false; NULL when publishing.
--   updated_at  when the row last changed.
--
-- The code treats a MISSING row, or an unreadable table, as publishing = false
-- (fail closed) and logs it.
--
-- Resume after an audit stop, once the cause is understood:
--   UPDATE t_bot_surface_state SET publishing = true, reason = NULL, updated_at = now() WHERE id = 1;
--
-- Production does not run migrations on deploy: apply this file by hand.
-- Idempotent: it never resets the row once it exists.
-- =============================================================================

CREATE TABLE IF NOT EXISTS t_bot_surface_state (
  id integer PRIMARY KEY,
  publishing boolean NOT NULL DEFAULT true,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT t_bot_surface_state_single_row CHECK (id = 1)
);
ALTER TABLE t_bot_surface_state OWNER TO gc_owner;
INSERT INTO t_bot_surface_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
