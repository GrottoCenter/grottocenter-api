\c grottoce;

-- =============================================================================
-- #1759: v_bot_page, the one source of everything the bot pages publish
-- =============================================================================
--
-- One row per published page; this file defines the cave pages. Massifs and
-- organizations are added to the same view next. The pages, the sitemaps and
-- the withdrawal worker all read it, so anything absent from it is not
-- published. It is a plain view: the nightly job reads it by keyset
-- (entity_id > $1 ORDER BY entity_id LIMIT 1000), not a materialized view.
--
--   entity_type, entity_id, language   what the page is, in the language of its
--                                      main name
--   lastmod                            the latest date among the record, the
--                                      descriptions shown and the nested items
--   page                               jsonb holding exactly the fields named in
--                                      api/utils/botSurfaceWhitelist.js; a test
--                                      compares the two. No coordinate of any
--                                      kind appears here.
--
-- Gates, all re-checked on every read (admission is necessary, not sufficient):
--
--   cave        live (not deleted, not merged), admitted, a main name that
--               passed the coordinate scan, and at least one embedded entrance.
--               A cave whose entrances are all sensitive has none, so it is
--               absent.
--   entrance    embedded in its cave; live, not sensitive, admitted. A locked,
--               non-sensitive entrance is shown: the lock is honoured. Its name
--               is null when it has no main name that passed the scan.
--   massif      listed on a cave when admitted, live, not sensitive, named
--               (scan passed), and holding an embedded entrance of the cave.
--   description shown when not deleted, at least t_bot_config.min_age_days old
--               (the later of inscription and review), and covered by a clean
--               t_bot_text_scan row made at t_bot_config.pattern_version for
--               the text as it is now. Otherwise it is left out and the page
--               stays. Repeated attribution texts are shown: they only stop
--               counting for the content rule, in bot_admit_pages().
--
-- This view does not re-derive sensitivity from the massif polygons: a spatial
-- join per entrance would be expensive, and it would hide the defect. A wrong
-- is_sensitive flag also leaks through the SPA, the search index and
-- GET /api/v1/entrances/:id, so it is fixed at the source. bot_cascade_check()
-- asserts that the propagation holds, and the nightly pipeline stops when it
-- does not.
--
-- Production does not run migrations on deploy: apply this file by hand, after
-- sql/9_28_2026_10_28_bot_foundation.sql and sql/9_29_2026_10_29_bot_admit_pages.sql.
-- Idempotent.
-- =============================================================================

CREATE OR REPLACE VIEW v_bot_page AS
SELECT
  'cave'::text AS entity_type,
  c.id AS entity_id,
  cn.id_language AS language,
  GREATEST(
    c.date_inscription, c.date_reviewed, cd.last_date, ce.last_date, cm.last_date
  ) AS lastmod,
  jsonb_build_object(
    'id', c.id,
    'name', cn.name,
    'language', cn.id_language,
    'depth', c.depth,
    'length', c.length,
    'temperature', c.temperature,
    'isDiving', c.is_diving,
    'lastmod', GREATEST(
      c.date_inscription, c.date_reviewed, cd.last_date, ce.last_date, cm.last_date
    ),
    'descriptions', COALESCE(cd.items, '[]'::jsonb),
    'massifs', COALESCE(cm.items, '[]'::jsonb),
    'entrances', ce.items
  ) AS page
FROM t_cave c
CROSS JOIN t_bot_config cfg
JOIN t_bot_admission ca ON ca.entity_type = 'cave' AND ca.entity_id = c.id
-- Main name that passed the scan; no such name, no page
JOIN LATERAL (
  SELECT n.name, n.id_language
  FROM t_name n
  WHERE n.id_cave = c.id AND n.is_main AND n.is_deleted = false
  AND EXISTS (
    SELECT 1 FROM t_bot_text_scan s
    WHERE s.source_table = 't_name' AND s.source_id = n.id AND s.matched = false
    AND s.pattern_version = cfg.pattern_version
    AND s.body_hash = md5(COALESCE(n.name, ''))
  )
  ORDER BY n.id
  LIMIT 1
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
    max(GREATEST(e.date_inscription, e.date_reviewed, ed.last_date)) AS last_date
  FROM t_entrance e
  JOIN t_bot_admission ea ON ea.entity_type = 'entrance' AND ea.entity_id = e.id
  LEFT JOIN t_iso3166_2 iso ON iso.iso = e.iso_3166_2
  LEFT JOIN LATERAL (
    SELECT n.name, n.id_language
    FROM t_name n
    WHERE n.id_entrance = e.id AND n.is_main AND n.is_deleted = false
    AND EXISTS (
      SELECT 1 FROM t_bot_text_scan s
      WHERE s.source_table = 't_name' AND s.source_id = n.id AND s.matched = false
      AND s.pattern_version = cfg.pattern_version
      AND s.body_hash = md5(COALESCE(n.name, ''))
    )
    ORDER BY n.id
    LIMIT 1
  ) en ON true
  LEFT JOIN LATERAL (
    SELECT
      jsonb_agg(
        jsonb_build_object('title', d.title, 'body', d.body, 'language', d.id_language)
        ORDER BY d.relevance DESC NULLS LAST, d.id
      ) AS items,
      max(GREATEST(d.date_inscription, d.date_reviewed)) AS last_date
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
    max(GREATEST(d.date_inscription, d.date_reviewed)) AS last_date
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
    max(GREATEST(m.date_inscription, m.date_reviewed)) AS last_date
  FROM t_massif m
  JOIN t_bot_admission ma ON ma.entity_type = 'massif' AND ma.entity_id = m.id
  JOIN LATERAL (
    SELECT n.name
    FROM t_name n
    WHERE n.id_massif = m.id AND n.is_main AND n.is_deleted = false
    AND EXISTS (
      SELECT 1 FROM t_bot_text_scan s
      WHERE s.source_table = 't_name' AND s.source_id = n.id AND s.matched = false
      AND s.pattern_version = cfg.pattern_version
      AND s.body_hash = md5(COALESCE(n.name, ''))
    )
    ORDER BY n.id
    LIMIT 1
  ) mn ON true
  WHERE m.is_deleted = false AND m.redirect_to IS NULL AND m.is_sensitive = false
  AND m.id IN (
    SELECT DISTINCT m2.id
    FROM t_entrance e
    JOIN t_bot_admission ea ON ea.entity_type = 'entrance' AND ea.entity_id = e.id
    JOIN t_massif m2 ON m2.geog_polygon && e.point_geom
      AND ST_Contains(m2.geog_polygon::geometry, e.point_geom)
    WHERE e.id_cave = c.id AND e.is_deleted = false AND e.redirect_to IS NULL
    AND e.is_sensitive = false
  )
) cm ON true
WHERE c.is_deleted = false AND c.redirect_to IS NULL;
ALTER VIEW v_bot_page OWNER TO gc_owner;
