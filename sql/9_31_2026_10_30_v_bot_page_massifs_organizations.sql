\c grottoce;

-- =============================================================================
-- #1759: v_bot_page gains the massif and organization pages; v_bot_redirect
-- =============================================================================
--
-- Redefines v_bot_page (sql/9_30_2026_10_29_v_bot_page.sql) as the cave branch,
-- unchanged, plus a massif branch and an organization branch (UNION ALL, same
-- columns), and adds v_bot_redirect. Idempotent.
--
-- v_bot_page: one row per published page. The pages, the sitemaps and the
-- withdrawal worker all read it, so anything absent from it is not published.
-- It is a plain view: the nightly job reads it by keyset
-- (entity_id > $1 ORDER BY entity_id LIMIT 1000), not a materialized view.
--
--   entity_type, entity_id, language   what the page is, in the language of its
--                                      main name
--   lastmod                            a hint for the sitemap: the latest of
--                                      the record's own dates, the moment each
--                                      embedded item was admitted, the moment
--                                      each description became old enough to
--                                      show, and the dates of the names shown.
--                                      It does not see content that appears
--                                      because its scan arrives late (a first
--                                      scan, a rescan after a pattern version
--                                      bump, a quarantine cleared): the scan
--                                      date is left out on purpose, as a bump
--                                      rescans every text and would move every
--                                      page. Nor does it see content that drops
--                                      out (deleted, quarantined, made
--                                      sensitive, a cave leaving a massif); it
--                                      can even go back. Whoever decides what
--                                      to regenerate or withdraw compares a
--                                      hash of `page`.
--   page                               jsonb holding exactly the fields named in
--                                      api/utils/botSurfaceWhitelist.js; a test
--                                      compares the two. No coordinate of any
--                                      kind appears here.
--
-- Gates, all re-checked on every read (admission is necessary, not sufficient).
-- The main name of a record is the one with the lowest id; only then is its
-- t_bot_text_scan verdict checked (clean, at t_bot_config.pattern_version, for
-- the name as it is now). Another main name is never substituted.
--
--   cave        live (not deleted, not merged), admitted, a main name that
--               passed the coordinate scan, and at least one embedded entrance.
--               A cave whose entrances are all sensitive has none, so it is
--               absent.
--   entrance    embedded in its cave; live, not sensitive, admitted. A locked,
--               non-sensitive entrance is shown: the lock is honoured. Its name
--               is null when it has no main name that passed the scan.
--   massif      page: live, admitted, not sensitive, a main name that passed
--               the scan, and at least one listed cave (decision on #1759: no
--               published cave, no massif page). Listed on a cave: admitted,
--               live, not sensitive, named (scan passed), and holding an
--               embedded entrance of the cave.
--   massif's    {id, name, depth, length} of the caves that have a page in this
--   caves       view (admitted, live, named, an embedded entrance) and hold an
--               embedded entrance (live, not sensitive, admitted) inside the
--               massif polygon. The list is capped at 100 caves, the deepest
--               first (unknown depth last), then by id. THE CAP OF 100 IS A
--               PROPOSAL, not a decided rule: it keeps a page and the batch
--               that reads it bounded when a large massif holds thousands of
--               caves. Change the LIMIT below to move it; lastmod follows the
--               caves listed, so a cave leaving or entering the top 100 is a
--               change a hash of `page` sees and lastmod may not.
--   organization live, admitted, a main name that passed the scan. No
--               sensitivity flag exists for organizations. Never published:
--               address, postal code, mail, custom message, cavers,
--               coordinates, picture, partner flag.
--   description shown (cave, entrance, massif) when not deleted, at least
--               t_bot_config.min_age_days old (the later of inscription and
--               review), and covered by a clean t_bot_text_scan row made at
--               t_bot_config.pattern_version for the text as it is now.
--               Otherwise it is left out and the page stays. Repeated
--               attribution texts are shown: they only stop counting for the
--               content rule, in bot_admit_pages(). Organizations have none.
--
-- This view does not re-derive sensitivity from the massif polygons: a spatial
-- join per entrance would be expensive, and it would hide the defect. A wrong
-- is_sensitive flag also leaks through the SPA, the search index and
-- GET /api/v1/entrances/:id, so it is fixed at the source. bot_cascade_check()
-- asserts that the propagation holds, and the nightly pipeline stops when it
-- does not. The massif branch looks for its caves from the entrances (the
-- partial GiST index on public entrances applies) and never writes a
-- coordinate into `page`.
--
-- v_bot_redirect (entity_type, entity_id, target_id): the merged records
-- (redirect_to set) of type cave, massif and organization, with the final
-- target of their redirect chain, for the redirect pages (#1766). A row exists
-- only when:
--   (a) the merged record has a t_bot_admission row: it was published, so
--       crawlers may know its address; and
--   (b) the final target, at the end of the chain, has a row in v_bot_page of
--       the same type: the redirect leads to a page that exists.
-- The chain follows redirect_to through merged records and stops at the first
-- record that is not merged; it is cut after 10 redirects, so a cycle (or a
-- self-redirect) never reaches a target and yields no row. A merged record is
-- normally also soft-deleted (that is what a merge does), so is_deleted is NOT
-- looked at on the source or on the intermediate records: deleted AND merged
-- redirects, deleted alone does not (it is gone). The source's own page never
-- exists in v_bot_page (redirect_to set), so the two views never overlap.
--
-- Production does not run migrations on deploy: apply this file by hand, after
-- sql/9_30_2026_10_29_v_bot_page.sql.
-- =============================================================================

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
    'url', g.url,
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

CREATE OR REPLACE VIEW v_bot_redirect AS
WITH RECURSIVE
  -- Every merged record, whatever its is_deleted: a merge also deletes it
  merged AS MATERIALIZED (
    SELECT 'cave'::text AS entity_type, id, redirect_to FROM t_cave WHERE redirect_to IS NOT NULL
    UNION ALL
    SELECT 'massif'::text, id, redirect_to FROM t_massif WHERE redirect_to IS NOT NULL
    UNION ALL
    SELECT 'organization'::text, id, redirect_to FROM t_grotto WHERE redirect_to IS NOT NULL
  ),
  -- hops = number of redirects followed; a chain is followed for 10 at most
  walk (entity_type, entity_id, node, hops) AS (
    SELECT mg.entity_type, mg.id, mg.redirect_to, 1
    FROM merged mg
    JOIN t_bot_admission a ON a.entity_type = mg.entity_type AND a.entity_id = mg.id
    UNION ALL
    SELECT w.entity_type, w.entity_id, nx.redirect_to, w.hops + 1
    FROM walk w
    JOIN merged nx ON nx.entity_type = w.entity_type AND nx.id = w.node
    WHERE w.hops < 10
  )
SELECT w.entity_type, w.entity_id, w.node AS target_id
FROM walk w
-- The end of the chain: a record with a page. A merged record never has one
-- (redirect_to is set), so the walk's intermediate steps and a chain cut at 10
-- redirects are left out by this test alone.
WHERE EXISTS (
  SELECT 1 FROM v_bot_page p WHERE p.entity_type = w.entity_type AND p.entity_id = w.node
);
ALTER VIEW v_bot_redirect OWNER TO gc_owner;
