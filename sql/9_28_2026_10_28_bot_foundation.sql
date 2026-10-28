\c grottoce;

-- =============================================================================
-- #1759: tables behind the bot-indexing pages
-- =============================================================================
--
-- Three small tables. They hold no content, only decisions:
--
--   t_bot_admission  which records have been admitted to the bot surface, and
--                    when. Sticky: a row is inserted the first time a record
--                    qualifies and is never updated or deleted, so a page does
--                    not leave and re-enter search results every time someone
--                    edits it. Written by bot_admit_pages() (nightly pipeline).
--                    Sticky against edits only: the age and content rules are
--                    judged once, but a record that is later soft-deleted,
--                    merged (redirect_to) or put in a sensitive massif still
--                    leaves the surface, because v_bot_page re-checks those
--                    gates every time it is read. Admission is necessary, not
--                    sufficient.
--   t_bot_config     one row of thresholds, so changing the content-rule stage
--                    is a data change, not a migration.
--   t_bot_text_scan  the verdict of the coordinate detector (#1761) for each
--                    free text, in a table of its own: writing flag columns on
--                    the text tables would fire their history, change-log and
--                    search-reindexing triggers for data nobody edited.
--                    It holds exactly the free texts the bot pages publish:
--                    t_description (body_hash covers the title and the body,
--                    md5(coalesce(title, '') || E'\n' || coalesce(body, ''))),
--                    which also carries document titles, and t_name (body_hash
--                    is md5(name)). t_location, t_comment, t_history and
--                    t_rigging are never rendered, so they are not scanned. A
--                    change that starts publishing another text must widen the
--                    source_table check below first, in a new migration.
--
-- Nothing reads them yet. v_bot_page and bot_admit_pages() follow.
--
-- Production does not run migrations on deploy: apply this file by hand.
-- Idempotent, and it never resets t_bot_config once an operator has changed it.
-- =============================================================================

CREATE TABLE IF NOT EXISTS t_bot_admission (
  entity_type varchar(16) NOT NULL,
  entity_id integer NOT NULL,
  bot_admitted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id),
  CONSTRAINT t_bot_admission_entity_type_check
    CHECK (entity_type IN ('cave', 'entrance', 'massif', 'organization', 'document'))
);
ALTER TABLE t_bot_admission OWNER TO gc_owner;

CREATE TABLE IF NOT EXISTS t_bot_config (
  id smallint PRIMARY KEY DEFAULT 1,
  -- A record is admitted once it is this old (GREATEST of its inscription and review dates).
  min_age_days integer NOT NULL DEFAULT 30,
  -- Content rule for caves, stage 1: unique text of at least this many
  -- characters, or depth, or length. Later stages lower min_text_chars to
  -- 300, then 200. 0 means unknown for depth and length, so it never counts.
  min_text_chars integer NOT NULL DEFAULT 500,
  min_depth_m integer NOT NULL DEFAULT 300,
  min_length_m integer NOT NULL DEFAULT 3000,
  -- A text found on more than this many caves is boilerplate and does not count as unique.
  max_boilerplate_caves integer NOT NULL DEFAULT 3,
  CONSTRAINT t_bot_config_single_row CHECK (id = 1),
  CONSTRAINT t_bot_config_positive CHECK (
    min_age_days >= 0 AND min_text_chars > 0 AND min_depth_m > 0
    AND min_length_m > 0 AND max_boilerplate_caves > 0
  )
);
ALTER TABLE t_bot_config OWNER TO gc_owner;
INSERT INTO t_bot_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS t_bot_text_scan (
  source_table varchar(16) NOT NULL,
  source_id integer NOT NULL,
  -- Hash of the text that was scanned: a different hash means the text was edited.
  body_hash varchar(64) NOT NULL,
  -- coordinateDetector PATTERN_SET_VERSION in force when it was scanned.
  pattern_version integer NOT NULL,
  matched boolean NOT NULL,
  -- The family that matched, or 'error' when the detector threw (fail closed).
  pattern_id varchar(32),
  -- The matched text, for moderators only. Never published.
  match_excerpt varchar(80),
  scanned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_table, source_id),
  CONSTRAINT t_bot_text_scan_source_table_check
    CHECK (source_table IN ('t_description', 't_name')),
  CONSTRAINT t_bot_text_scan_matched_check
    CHECK (matched OR (pattern_id IS NULL AND match_excerpt IS NULL))
);
ALTER TABLE t_bot_text_scan OWNER TO gc_owner;
