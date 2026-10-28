\c grottoce;

-- =============================================================================
-- #1759: admission of records to the bot surface
-- =============================================================================
--
-- bot_admit_pages() is step 2 of the nightly pipeline (#1760). It inserts a
-- row in t_bot_admission the first time a record qualifies, and never updates
-- or deletes one. Admission is necessary, not sufficient: v_bot_page re-checks
-- deletion, merges and sensitivity every time it is read.
--
-- A record qualifies when it is live (is_deleted = false, redirect_to NULL) and
-- at least min_age_days old, judged on GREATEST(date_inscription,
-- date_reviewed), plus, per type:
--
--   entrance      not sensitive. A locked, non-sensitive entrance qualifies.
--   cave          has an admitted public entrance AND meets the content rule:
--                 unique description text of at least min_text_chars, OR depth
--                 of at least min_depth_m, OR length of at least min_length_m.
--                 0 means unknown for depth and length and never counts.
--   massif        not sensitive, and holds at least one admitted public
--                 entrance of an admitted cave.
--   organization  the common gates only.
--
-- Unique text is the body of the descriptions of the cave and of its admitted
-- public entrances that pass the text gates, counted once per distinct body:
-- not deleted, at least min_age_days old, and a t_bot_text_scan row that is
-- clean, was made at t_bot_config.pattern_version and covers the text as it is
-- now. A body that appears on more than max_boilerplate_caves caves is
-- boilerplate (an attribution repeated on thousands of caves) and is ignored.
--
-- t_bot_config.pattern_version is the coordinate detector's current pattern set
-- version. The scan step (#1761) sets it once every text has been scanned at
-- that version; 0, the default, means no complete scan, so no text counts.
--
-- Documents stay disabled until their phase.
--
-- Returns the number of rows admitted per entity type. Run in one transaction,
-- entrances first, so a cave qualifies the night its entrance does.
--
-- Production does not run migrations on deploy: apply this file by hand.
-- Idempotent.
-- =============================================================================

ALTER TABLE t_bot_config ADD COLUMN IF NOT EXISTS pattern_version integer NOT NULL DEFAULT 0;
ALTER TABLE t_bot_config DROP CONSTRAINT IF EXISTS t_bot_config_pattern_version_check;
ALTER TABLE t_bot_config ADD CONSTRAINT t_bot_config_pattern_version_check CHECK (pattern_version >= 0);

CREATE OR REPLACE FUNCTION bot_admit_pages()
RETURNS TABLE (entity_type text, admitted bigint)
LANGUAGE plpgsql AS $$
DECLARE
  cfg t_bot_config%ROWTYPE;
  cutoff timestamp;
  n bigint;
BEGIN
  -- STRICT: a missing configuration row must stop the pipeline, not read as
  -- "nothing qualifies" and report zero admissions every night.
  SELECT * INTO STRICT cfg FROM t_bot_config WHERE id = 1;
  cutoff := LOCALTIMESTAMP - make_interval(days => cfg.min_age_days);

  INSERT INTO t_bot_admission (entity_type, entity_id)
  SELECT 'entrance', e.id
  FROM t_entrance e
  WHERE e.is_deleted = false AND e.redirect_to IS NULL AND e.is_sensitive = false
  AND GREATEST(e.date_inscription, e.date_reviewed) <= cutoff
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  entity_type := 'entrance'; admitted := n; RETURN NEXT;

  INSERT INTO t_bot_admission (entity_type, entity_id)
  WITH descriptions AS MATERIALIZED (
    -- Every description that belongs to a cave, directly or through an entrance
    SELECT d.id, d.title, d.body, d.date_inscription, d.date_reviewed,
           COALESCE(d.id_cave, e.id_cave) AS cave_id,
           d.id_entrance,
           md5(btrim(d.body)) AS body_key
    FROM t_description d
    LEFT JOIN t_entrance e ON e.id = d.id_entrance
    WHERE d.is_deleted = false AND d.body IS NOT NULL AND btrim(d.body) <> ''
    AND COALESCE(d.id_cave, e.id_cave) IS NOT NULL
  ),
  boilerplate AS (
    SELECT body_key FROM descriptions
    GROUP BY body_key HAVING count(DISTINCT cave_id) > cfg.max_boilerplate_caves
  ),
  unique_text AS MATERIALIZED (
    SELECT cave_id, sum(len) AS chars
    FROM (
      SELECT DISTINCT d.cave_id, d.body_key, char_length(btrim(d.body)) AS len
      FROM descriptions d
      JOIN t_bot_text_scan s
        ON s.source_table = 't_description' AND s.source_id = d.id
        AND s.matched = false AND s.pattern_version = cfg.pattern_version
        AND s.body_hash = md5(COALESCE(d.title, '') || E'\n' || COALESCE(d.body, ''))
      WHERE GREATEST(d.date_inscription, d.date_reviewed) <= cutoff
      AND d.body_key NOT IN (SELECT body_key FROM boilerplate)
      AND (
        d.id_entrance IS NULL
        OR EXISTS (
          SELECT 1 FROM t_entrance e
          JOIN t_bot_admission a ON a.entity_type = 'entrance' AND a.entity_id = e.id
          WHERE e.id = d.id_entrance AND e.is_deleted = false AND e.is_sensitive = false
        )
      )
    ) distinct_texts
    GROUP BY cave_id
  )
  SELECT 'cave', c.id
  FROM t_cave c
  LEFT JOIN unique_text u ON u.cave_id = c.id
  WHERE c.is_deleted = false AND c.redirect_to IS NULL
  AND GREATEST(c.date_inscription, c.date_reviewed) <= cutoff
  AND EXISTS (
    SELECT 1 FROM t_entrance e
    JOIN t_bot_admission a ON a.entity_type = 'entrance' AND a.entity_id = e.id
    WHERE e.id_cave = c.id AND e.is_deleted = false AND e.is_sensitive = false
  )
  AND (
    COALESCE(c.depth, 0) >= cfg.min_depth_m
    OR COALESCE(c.length, 0) >= cfg.min_length_m
    OR COALESCE(u.chars, 0) >= cfg.min_text_chars
  )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  entity_type := 'cave'; admitted := n; RETURN NEXT;

  -- Driven from the massifs so the polygon is cast once per massif and the
  -- entrance index applies (the same shape as bot_cascade_check()); the
  -- admission tables are small and are joined afterwards.
  INSERT INTO t_bot_admission (entity_type, entity_id)
  WITH inside AS MATERIALIZED (
    SELECT DISTINCT m.id AS massif_id, e.id AS entrance_id, e.id_cave
    FROM t_massif m
    JOIN t_entrance e
      ON e.point_geom && m.geog_polygon::geometry
      AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
    WHERE m.is_deleted = false AND m.redirect_to IS NULL AND m.is_sensitive = false
    AND GREATEST(m.date_inscription, m.date_reviewed) <= cutoff
    AND e.is_deleted = false AND e.is_sensitive = false
  )
  SELECT 'massif', i.massif_id
  FROM inside i
  JOIN t_bot_admission ae ON ae.entity_type = 'entrance' AND ae.entity_id = i.entrance_id
  JOIN t_bot_admission ac ON ac.entity_type = 'cave' AND ac.entity_id = i.id_cave
  GROUP BY i.massif_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  entity_type := 'massif'; admitted := n; RETURN NEXT;

  INSERT INTO t_bot_admission (entity_type, entity_id)
  SELECT 'organization', g.id
  FROM t_grotto g
  WHERE g.is_deleted = false AND g.redirect_to IS NULL
  AND GREATEST(g.date_inscription, g.date_reviewed) <= cutoff
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  entity_type := 'organization'; admitted := n; RETURN NEXT;
END;
$$;
ALTER FUNCTION bot_admit_pages() OWNER TO gc_owner;
