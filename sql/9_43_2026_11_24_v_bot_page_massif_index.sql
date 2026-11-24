\c grottoce;

-- =============================================================================
-- #2022: v_bot_page reads the massifs of a cave through the GiST index
-- =============================================================================
--
-- The cave branch lists the massifs that hold an embedded entrance of the cave
-- with `JOIN t_massif m2 ON m2.geog_polygon && e.point_geom AND ST_Contains(...)`.
-- The only spatial index on t_massif, idx_t_massif_geog, is partial
-- (WHERE is_deleted = false), and m2 carried no is_deleted predicate (the one on
-- `m` does not prove it for `m2`), so the planner could not use it: every cave
-- compared its entrances with all 6,400 polygons, about 32,000 buffers and
-- 65 ms per cave. A 1000-cave batch cost 137-190 s, and v_bot_hub, which reads
-- every cave of v_bot_page, 162 s.
--
-- The only change is `AND m2.is_deleted = false` in that join. The result is the
-- same: the outer query already requires m.is_deleted = false and m.id = m2.id.
-- Measured on one cave in production: 31,918 buffers and 65 ms before, 47
-- buffers and 0.5 ms after.
--
-- The rest of the definition is the one of
-- sql/9_31_2026_10_30_v_bot_page_massifs_organizations.sql, unchanged: same
-- columns, so CREATE OR REPLACE keeps v_bot_hub (which reads this view) and the
-- grants. A plain view holds no data, so there is nothing to refresh; the
-- replacement takes an ACCESS EXCLUSIVE lock for a catalog update only. Only the
-- nightly bot pipeline reads this view (starts 01:30 UTC): apply it outside the
-- run and outside 04:20-05:10 UTC. If the lock_timeout fires, run it again.
--
-- Production does not run migrations on deploy: apply this file by hand. Nothing
-- in the API depends on it, so the order against the deploy does not matter.
-- Idempotent.
-- =============================================================================

BEGIN;
SET LOCAL lock_timeout = '3s';

CREATE OR REPLACE VIEW v_bot_page AS
SELECT
  'cave'::text AS entity_type,
  c.id AS entity_id,
  cn.id_language AS language,
  lm.lastmod AS lastmod,
  jsonb_build_object(
    'id', c.id,
    'name', cn.name,
    'language', cn.id_language,
    'depth', c.depth,
    'length', c.length,
    'temperature', c.temperature,
    'isDiving', c.is_diving,
    'lastmod', lm.lastmod,
    'descriptions', COALESCE(cd.items, '[]'::jsonb),
    'massifs', COALESCE(cm.items, '[]'::jsonb),
    'entrances', ce.items
  ) AS page
FROM t_cave c
CROSS JOIN t_bot_config cfg
JOIN t_bot_admission ca ON ca.entity_type = 'cave' AND ca.entity_id = c.id
-- The main name (the lowest id when there are several), and only if it passed
-- the scan; no such name, no page
JOIN LATERAL (
  SELECT m.name, m.id_language, GREATEST(m.date_inscription, m.date_reviewed) AS changed
  FROM (
    SELECT n.id, n.name, n.id_language, n.date_inscription, n.date_reviewed
    FROM t_name n
    WHERE n.id_cave = c.id AND n.is_main AND n.is_deleted = false
    ORDER BY n.id
    LIMIT 1
  ) m
  WHERE EXISTS (
    SELECT 1 FROM t_bot_text_scan s
    WHERE s.source_table = 't_name' AND s.source_id = m.id AND s.matched = false
    AND s.pattern_version = cfg.pattern_version
    AND s.body_hash = md5(COALESCE(m.name, ''))
  )
) cn ON true
-- Embedded entrances; none, no page
JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'name', en.name,
        'language', en.id_language,
        'city', e.city,
        'county', e.county,
        'region', COALESCE(iso.name, e.region),
        'regionCode', e.iso_3166_2,
        'country', e.id_country,
        'discoveryYear', e.year_discovery,
        'dangerCo2', e.danger_co2,
        'dangerFlooding', e.danger_flooding,
        'dangerPollution', e.danger_pollution,
        'dangerRockfall', e.danger_rockfall,
        'hasBat', e.has_bat,
        'hasRules', e.has_rules,
        'isTouristic', e.is_touristic,
        'needCleanGear', e.need_clean_gear,
        'needStayOnTrail', e.need_stay_on_trail,
        'descriptions', COALESCE(ed.items, '[]'::jsonb)
      )
      ORDER BY e.id
    ) AS items,
    max(GREATEST(e.date_inscription, e.date_reviewed, ea.bot_admitted_at::timestamp, en.changed, ed.last_date)) AS last_date
  FROM t_entrance e
  JOIN t_bot_admission ea ON ea.entity_type = 'entrance' AND ea.entity_id = e.id
  LEFT JOIN t_iso3166_2 iso ON iso.iso = e.iso_3166_2
  LEFT JOIN LATERAL (
    SELECT m.name, m.id_language, GREATEST(m.date_inscription, m.date_reviewed) AS changed
    FROM (
      SELECT n.id, n.name, n.id_language, n.date_inscription, n.date_reviewed
      FROM t_name n
      WHERE n.id_entrance = e.id AND n.is_main AND n.is_deleted = false
      ORDER BY n.id
      LIMIT 1
    ) m
    WHERE EXISTS (
      SELECT 1 FROM t_bot_text_scan s
      WHERE s.source_table = 't_name' AND s.source_id = m.id AND s.matched = false
      AND s.pattern_version = cfg.pattern_version
      AND s.body_hash = md5(COALESCE(m.name, ''))
    )
  ) en ON true
  LEFT JOIN LATERAL (
    SELECT
      jsonb_agg(
        jsonb_build_object('title', d.title, 'body', d.body, 'language', d.id_language)
        ORDER BY d.relevance DESC NULLS LAST, d.id
      ) AS items,
      max(GREATEST(d.date_inscription, d.date_reviewed) + make_interval(days => cfg.min_age_days)) AS last_date
    FROM t_description d
    WHERE d.id_entrance = e.id AND d.is_deleted = false
    AND GREATEST(d.date_inscription, d.date_reviewed)
        <= LOCALTIMESTAMP - make_interval(days => cfg.min_age_days)
    AND EXISTS (
      SELECT 1 FROM t_bot_text_scan s
      WHERE s.source_table = 't_description' AND s.source_id = d.id AND s.matched = false
      AND s.pattern_version = cfg.pattern_version
      AND s.body_hash = md5(COALESCE(d.title, '') || E'\n' || COALESCE(d.body, ''))
    )
  ) ed ON true
  WHERE e.id_cave = c.id AND e.is_deleted = false AND e.redirect_to IS NULL
  AND e.is_sensitive = false
) ce ON ce.items IS NOT NULL
-- Descriptions of the cave itself
LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object('title', d.title, 'body', d.body, 'language', d.id_language)
      ORDER BY d.relevance DESC NULLS LAST, d.id
    ) AS items,
    max(GREATEST(d.date_inscription, d.date_reviewed) + make_interval(days => cfg.min_age_days)) AS last_date
  FROM t_description d
  WHERE d.id_cave = c.id AND d.is_deleted = false
  AND GREATEST(d.date_inscription, d.date_reviewed)
      <= LOCALTIMESTAMP - make_interval(days => cfg.min_age_days)
  AND EXISTS (
    SELECT 1 FROM t_bot_text_scan s
    WHERE s.source_table = 't_description' AND s.source_id = d.id AND s.matched = false
    AND s.pattern_version = cfg.pattern_version
    AND s.body_hash = md5(COALESCE(d.title, '') || E'\n' || COALESCE(d.body, ''))
  )
) cd ON true
-- Massifs that hold an embedded entrance of the cave. Driven from the entrances
-- so the massif index applies, as in bot_cascade_check().
LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(jsonb_build_object('id', m.id, 'name', mn.name) ORDER BY m.id) AS items,
    max(GREATEST(m.date_inscription, m.date_reviewed, ma.bot_admitted_at::timestamp, mn.changed)) AS last_date
  FROM t_massif m
  JOIN t_bot_admission ma ON ma.entity_type = 'massif' AND ma.entity_id = m.id
  JOIN LATERAL (
    SELECT x.name, GREATEST(x.date_inscription, x.date_reviewed) AS changed
    FROM (
      SELECT n.id, n.name, n.date_inscription, n.date_reviewed
      FROM t_name n
      WHERE n.id_massif = m.id AND n.is_main AND n.is_deleted = false
      ORDER BY n.id
      LIMIT 1
    ) x
    WHERE EXISTS (
      SELECT 1 FROM t_bot_text_scan s
      WHERE s.source_table = 't_name' AND s.source_id = x.id AND s.matched = false
      AND s.pattern_version = cfg.pattern_version
      AND s.body_hash = md5(COALESCE(x.name, ''))
    )
  ) mn ON true
  WHERE m.is_deleted = false AND m.redirect_to IS NULL AND m.is_sensitive = false
  AND m.id IN (
    SELECT DISTINCT m2.id
    FROM t_entrance e
    JOIN t_bot_admission ea ON ea.entity_type = 'entrance' AND ea.entity_id = e.id
    JOIN t_massif m2 ON m2.geog_polygon && e.point_geom
      AND ST_Contains(m2.geog_polygon::geometry, e.point_geom)
      -- The predicate of idx_t_massif_geog (partial); without it the index is unusable
      AND m2.is_deleted = false
    WHERE e.id_cave = c.id AND e.is_deleted = false AND e.redirect_to IS NULL
    AND e.is_sensitive = false
  )
) cm ON true
-- Computed once, so the column and the document cannot disagree
CROSS JOIN LATERAL (
  SELECT GREATEST(
    c.date_inscription, c.date_reviewed, ca.bot_admitted_at::timestamp,
    cn.changed, cd.last_date, ce.last_date, cm.last_date
  ) AS lastmod
) lm
WHERE c.is_deleted = false AND c.redirect_to IS NULL

UNION ALL

SELECT
  'massif'::text AS entity_type,
  m.id AS entity_id,
  mn.id_language AS language,
  lm.lastmod AS lastmod,
  jsonb_build_object(
    'id', m.id,
    'name', mn.name,
    'language', mn.id_language,
    'lastmod', lm.lastmod,
    'descriptions', COALESCE(md.items, '[]'::jsonb),
    'caves', mc.items
  ) AS page
FROM t_massif m
CROSS JOIN t_bot_config cfg
JOIN t_bot_admission ma ON ma.entity_type = 'massif' AND ma.entity_id = m.id
-- The main name (the lowest id when there are several), and only if it passed
-- the scan; no such name, no page
JOIN LATERAL (
  SELECT x.name, x.id_language, GREATEST(x.date_inscription, x.date_reviewed) AS changed
  FROM (
    SELECT n.id, n.name, n.id_language, n.date_inscription, n.date_reviewed
    FROM t_name n
    WHERE n.id_massif = m.id AND n.is_main AND n.is_deleted = false
    ORDER BY n.id
    LIMIT 1
  ) x
  WHERE EXISTS (
    SELECT 1 FROM t_bot_text_scan s
    WHERE s.source_table = 't_name' AND s.source_id = x.id AND s.matched = false
    AND s.pattern_version = cfg.pattern_version
    AND s.body_hash = md5(COALESCE(x.name, ''))
  )
) mn ON true
-- The caves listed: the ones that have a page in this view and hold an embedded
-- entrance inside the polygon; none, no page. Driven from the entrances (the
-- partial GiST index on public entrances), the cave is checked afterwards.
-- Capped at 100, the deepest first: the cap is a proposal (see the header).
JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object('id', k.id, 'name', k.name, 'depth', k.depth, 'length', k.length)
      ORDER BY k.depth DESC NULLS LAST, k.id
    ) AS items,
    max(k.last_date) AS last_date
  FROM (
    SELECT c.id, cn.name, c.depth, c.length,
      GREATEST(c.date_inscription, c.date_reviewed, ca.bot_admitted_at::timestamp, cn.changed) AS last_date
    FROM (
      SELECT DISTINCT e.id_cave
      FROM t_entrance e
      JOIN t_bot_admission ea ON ea.entity_type = 'entrance' AND ea.entity_id = e.id
      WHERE e.point_geom && m.geog_polygon::geometry
      AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
      AND e.is_deleted = false AND e.redirect_to IS NULL AND e.is_sensitive = false
    ) ie
    JOIN t_cave c ON c.id = ie.id_cave AND c.is_deleted = false AND c.redirect_to IS NULL
    JOIN t_bot_admission ca ON ca.entity_type = 'cave' AND ca.entity_id = c.id
    JOIN LATERAL (
      SELECT x.name, GREATEST(x.date_inscription, x.date_reviewed) AS changed
      FROM (
        SELECT n.id, n.name, n.date_inscription, n.date_reviewed
        FROM t_name n
        WHERE n.id_cave = c.id AND n.is_main AND n.is_deleted = false
        ORDER BY n.id
        LIMIT 1
      ) x
      WHERE EXISTS (
        SELECT 1 FROM t_bot_text_scan s
        WHERE s.source_table = 't_name' AND s.source_id = x.id AND s.matched = false
        AND s.pattern_version = cfg.pattern_version
        AND s.body_hash = md5(COALESCE(x.name, ''))
      )
    ) cn ON true
    ORDER BY c.depth DESC NULLS LAST, c.id
    LIMIT 100
  ) k
) mc ON mc.items IS NOT NULL
-- Descriptions of the massif itself
LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object('title', d.title, 'body', d.body, 'language', d.id_language)
      ORDER BY d.relevance DESC NULLS LAST, d.id
    ) AS items,
    max(GREATEST(d.date_inscription, d.date_reviewed) + make_interval(days => cfg.min_age_days)) AS last_date
  FROM t_description d
  WHERE d.id_massif = m.id AND d.is_deleted = false
  AND GREATEST(d.date_inscription, d.date_reviewed)
      <= LOCALTIMESTAMP - make_interval(days => cfg.min_age_days)
  AND EXISTS (
    SELECT 1 FROM t_bot_text_scan s
    WHERE s.source_table = 't_description' AND s.source_id = d.id AND s.matched = false
    AND s.pattern_version = cfg.pattern_version
    AND s.body_hash = md5(COALESCE(d.title, '') || E'\n' || COALESCE(d.body, ''))
  )
) md ON true
-- Computed once, so the column and the document cannot disagree
CROSS JOIN LATERAL (
  SELECT GREATEST(
    m.date_inscription, m.date_reviewed, ma.bot_admitted_at::timestamp,
    mn.changed, md.last_date, mc.last_date
  ) AS lastmod
) lm
WHERE m.is_deleted = false AND m.redirect_to IS NULL AND m.is_sensitive = false

UNION ALL

SELECT
  'organization'::text AS entity_type,
  g.id AS entity_id,
  gn.id_language AS language,
  lm.lastmod AS lastmod,
  jsonb_build_object(
    'id', g.id,
    'name', gn.name,
    'language', gn.id_language,
    'city', g.city,
    'county', g.county,
    'region', COALESCE(iso.name, g.region),
    'country', g.id_country,
    -- Free text typed by any user: only an http(s) address is published
    'url', CASE WHEN g.url ~* '^https?://[^[:space:]]+$' THEN g.url END,
    'yearBirth', g.year_birth,
    'lastmod', lm.lastmod
  ) AS page
FROM t_grotto g
CROSS JOIN t_bot_config cfg
JOIN t_bot_admission ga ON ga.entity_type = 'organization' AND ga.entity_id = g.id
-- The main name (the lowest id when there are several), and only if it passed
-- the scan; no such name, no page
JOIN LATERAL (
  SELECT x.name, x.id_language, GREATEST(x.date_inscription, x.date_reviewed) AS changed
  FROM (
    SELECT n.id, n.name, n.id_language, n.date_inscription, n.date_reviewed
    FROM t_name n
    WHERE n.id_grotto = g.id AND n.is_main AND n.is_deleted = false
    ORDER BY n.id
    LIMIT 1
  ) x
  WHERE EXISTS (
    SELECT 1 FROM t_bot_text_scan s
    WHERE s.source_table = 't_name' AND s.source_id = x.id AND s.matched = false
    AND s.pattern_version = cfg.pattern_version
    AND s.body_hash = md5(COALESCE(x.name, ''))
  )
) gn ON true
LEFT JOIN t_iso3166_2 iso ON iso.iso = g.iso_3166_2
-- Computed once, so the column and the document cannot disagree
CROSS JOIN LATERAL (
  SELECT GREATEST(
    g.date_inscription, g.date_reviewed, ga.bot_admitted_at::timestamp, gn.changed
  ) AS lastmod
) lm
WHERE g.is_deleted = false AND g.redirect_to IS NULL;
ALTER VIEW v_bot_page OWNER TO gc_owner;

COMMIT;
