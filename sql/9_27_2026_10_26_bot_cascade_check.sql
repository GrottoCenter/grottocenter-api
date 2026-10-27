\c grottoce;

-- =============================================================================
-- #1764: guard the massif-to-entrance sensitivity invariant
-- =============================================================================
--
-- The bot pages (v_bot_page) filter entrances on their own is_sensitive flag and
-- do not re-derive sensitivity from massif polygons: a spatial join would be
-- expensive, and it would hide the defect. A wrong flag also leaks through the
-- SPA, the search index and GET /api/v1/entrances/:id, so it is fixed at the
-- source. That is safe only while MassifService.propagateSensitivityToEntrances
-- and MassifService.isPointInSensitiveMassif have been fully applied; this
-- function asserts it, and the nightly bot pipeline stops when it finds a
-- violation.
--
--   violations: live entrances that are not sensitive and not locked, inside a
--               live sensitive massif. A failure.
--   overrides:  live entrances that are not sensitive but locked, inside a live
--               sensitive massif. A moderator's decision, honoured by the bot
--               pages. Reported so they stay visible, never a failure.
--
-- Each list is capped at 100 ids; the counts are exact.
--
-- Read-only. Safe to apply at any time.
-- =============================================================================

CREATE OR REPLACE FUNCTION bot_cascade_check()
RETURNS TABLE (
    violation_count bigint,
    violation_ids integer[],
    override_count bigint,
    override_ids integer[]
)
LANGUAGE sql STABLE AS $$
  -- Driven from the sensitive massifs so the polygon is cast once per massif
  -- and the entrance index applies; the other way round (EXISTS per entrance)
  -- times out on production. DISTINCT: an entrance can lie in two massifs.
  WITH exposed AS (
    SELECT DISTINCT e.id, e.is_sensitive_locked
    FROM t_massif m
    JOIN t_entrance e
      ON e.point_geom && m.geog_polygon::geometry
      AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
    WHERE m.is_deleted = false
    AND m.is_sensitive = true
    AND e.is_deleted = false
    AND e.is_sensitive = false
  ),
  violations AS (SELECT id FROM exposed WHERE is_sensitive_locked = false),
  overrides AS (SELECT id FROM exposed WHERE is_sensitive_locked = true)
  SELECT
    (SELECT count(*) FROM violations),
    ARRAY(SELECT id FROM violations ORDER BY id LIMIT 100),
    (SELECT count(*) FROM overrides),
    ARRAY(SELECT id FROM overrides ORDER BY id LIMIT 100);
$$;
ALTER FUNCTION bot_cascade_check() OWNER TO gc_owner;
