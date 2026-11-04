\c grottoce;

-- =============================================================================
-- #1935: v_bot_hub, the country and region hubs; the manifest learns about them
-- =============================================================================
--
-- The hub pages (the countries index, a country, a region) are built from the
-- published caves, that is the rows of v_bot_page (entity_type = 'cave'), and
-- from nothing else: a hub names and links only a cave that has a page. The
-- figures next to them (number of caves, networks, massifs, diving caves,
-- total length, averages) are NOT computed here: they are the SPA's own
-- statistics (v_country_info, v_region_info, v_massif_info, read through
-- StatisticsCountryService and its siblings), may include records that are not
-- published, and are added by the generator.
--
-- Hub keys are strings (FR, FR-01), while v_bot_page.entity_id and
-- t_bot_page_manifest.entity_id are integers. So the hubs are not a fourth
-- entity_type of v_bot_page: they are a view of their own, keyed by
-- (hub_type, hub_key), read by keyset one type at a time like v_bot_page, and
-- the manifest gets entity_type 'hub' with two text columns.
--
-- v_bot_hub (hub_type, hub_key, language, lastmod, page)
--
--   hub_type  'index' (key 'ALL'), 'country' (key: ISO 3166-1 alpha-2, FR) or
--             'region' (key: the code of t_iso3166_2, FR-01)
--   language  the dominant language of the main names of the hub's published
--             caves (the most common v_bot_page.language, the lowest code on a
--             tie); NULL when none has one. The index, which is about every
--             country, is always 'eng'.
--   lastmod   the latest lastmod of the hub's caves. The generator does not
--             publish it: a hub's manifest lastmod is the time of its upload,
--             since its figures and its list change without its caves
--   page      jsonb holding exactly the fields named in
--             api/utils/botSurfaceWhitelist.js (hubIndex, hubCountry, hubRegion)
--
-- Gates:
--   - A hub exists only with at least one published cave. A country hub is
--     built from the caves that have a published entrance whose id_country is
--     the country; a region hub from the caves that have a published entrance
--     whose iso_3166_2 is the region (only published entrances are in the page).
--   - The country must exist in t_country with a native_name, and be two
--     letters. The region must exist in t_iso3166_2 with a name that is not
--     empty once cleaned, and its country (the part before the dash) must be a
--     country as above. The region name is t_iso3166_2.name ONLY, never a
--     name_<lang> column (#1937): `[bracketed alternatives]` and a trailing `*`
--     are removed (GB-CMN: "Carmarthenshire [Sir Gaerfyrddin GB-GFY]" becomes
--     "Carmarthenshire"; ES-NA: "Nafarroa*" becomes "Nafarroa").
--   - The countries index exists when at least one country hub does.
--   - A massif is listed on a hub when a published cave of the hub is listed
--     in that massif (v_bot_page: admitted, not sensitive, named, holding a
--     published entrance of the cave). This is cave-level: a network with one
--     entrance in each of two regions puts its massif on both. It is never a
--     spatial join, and a massif that is sensitive or without a name is not
--     in the cave's list, so it is not here.
--
-- Lists:
--   caves     at most 100 per hub, the best documented first: the characters of
--             the titles and bodies of the descriptions shown on the cave page
--             (the cave's and those of its published entrances), then a known
--             depth and a known length (a value of 0 is unknown), then the id.
--   massifs   all of them (about 330 exist), by id.
--   regions   (country hub) the region hubs of the country, by code.
--   countries (index) the country hubs, by code.
--
-- Read it by keyset, one type at a time:
--   WHERE hub_type = $1 AND hub_key > $2 ORDER BY hub_key LIMIT 1000
-- Every read evaluates the published caves of v_bot_page once. The generator
-- reads all the hubs once per run (at most about 870 rows).
--
-- t_bot_page_manifest: entity_type 'hub' gains hub_type and hub_key, and has
-- no entity_id (like 'static'). The sitemaps (#1767) list the rows where
-- redirect_to IS NULL; for a hub row hub_type tells which one it is.
--
-- Production does not run migrations on deploy: apply this file by hand, after
-- sql/9_33_2026_11_03_bot_page_manifest_redirect.sql. Idempotent.
-- v_bot_page can no longer be dropped while v_bot_hub exists: redefine it with
-- CREATE OR REPLACE VIEW, or drop v_bot_hub first.
-- =============================================================================

ALTER TABLE t_bot_page_manifest ADD COLUMN IF NOT EXISTS hub_type varchar(16);
ALTER TABLE t_bot_page_manifest ADD COLUMN IF NOT EXISTS hub_key varchar(16);

ALTER TABLE t_bot_page_manifest
  DROP CONSTRAINT IF EXISTS t_bot_page_manifest_entity_type_check;
ALTER TABLE t_bot_page_manifest
  ADD CONSTRAINT t_bot_page_manifest_entity_type_check
  CHECK (entity_type IN ('cave', 'massif', 'organization', 'hub', 'static'));

ALTER TABLE t_bot_page_manifest
  DROP CONSTRAINT IF EXISTS t_bot_page_manifest_entity_id_check;
ALTER TABLE t_bot_page_manifest
  ADD CONSTRAINT t_bot_page_manifest_entity_id_check
  CHECK ((entity_type IN ('hub', 'static')) = (entity_id IS NULL));

ALTER TABLE t_bot_page_manifest
  DROP CONSTRAINT IF EXISTS t_bot_page_manifest_redirect_to_check;
ALTER TABLE t_bot_page_manifest
  ADD CONSTRAINT t_bot_page_manifest_redirect_to_check
  CHECK (redirect_to IS NULL OR entity_type NOT IN ('hub', 'static'));

ALTER TABLE t_bot_page_manifest
  DROP CONSTRAINT IF EXISTS t_bot_page_manifest_hub_check;
ALTER TABLE t_bot_page_manifest
  ADD CONSTRAINT t_bot_page_manifest_hub_check
  CHECK (
    (entity_type = 'hub') = (hub_type IS NOT NULL AND hub_key IS NOT NULL)
    AND (hub_type IS NULL) = (hub_key IS NULL)
    AND (hub_type IS NULL OR hub_type IN ('index', 'country', 'region'))
  );

-- The generator walks the hubs of the manifest by key
CREATE INDEX IF NOT EXISTS t_bot_page_manifest_hub_idx
  ON t_bot_page_manifest (hub_type, hub_key) WHERE entity_type = 'hub';

CREATE OR REPLACE VIEW v_bot_hub AS
WITH
-- The published caves, with what the lists need. Evaluated once per read.
cave AS MATERIALIZED (
  SELECT
    p.entity_id AS cave_id,
    p.language,
    p.lastmod,
    p.page->>'name' AS name,
    p.page->'depth' AS depth,
    p.page->'length' AS length,
    p.page->'massifs' AS massifs,
    p.page->'entrances' AS entrances,
    (
      SELECT COALESCE(sum(char_length(COALESCE(d->>'title', '') || COALESCE(d->>'body', ''))), 0)
      FROM jsonb_array_elements(p.page->'descriptions') d
    ) + (
      SELECT COALESCE(sum(char_length(COALESCE(d->>'title', '') || COALESCE(d->>'body', ''))), 0)
      FROM jsonb_array_elements(p.page->'entrances') e
      CROSS JOIN LATERAL jsonb_array_elements(e->'descriptions') d
    ) AS doc_chars,
    (COALESCE((p.page->>'depth')::numeric, 0) > 0)::int
      + (COALESCE((p.page->>'length')::numeric, 0) > 0)::int AS facts
  FROM v_bot_page p
  WHERE p.entity_type = 'cave'
),
-- Where a published cave is: the country and the region of its published entrances
place AS MATERIALIZED (
  SELECT DISTINCT c.cave_id, e->>'country' AS country, e->>'regionCode' AS region_code
  FROM cave c
  CROSS JOIN LATERAL jsonb_array_elements(c.entrances) e
),
country AS MATERIALIZED (
  SELECT btrim(tc.iso) AS code
  FROM t_country tc
  WHERE btrim(tc.iso) ~ '^[A-Z]{2}$' AND btrim(COALESCE(tc.native_name, '')) <> ''
),
region AS MATERIALIZED (
  SELECT iso.iso AS code, split_part(iso.iso, '-', 1) AS country, r.name
  FROM t_iso3166_2 iso
  CROSS JOIN LATERAL (
    SELECT btrim(regexp_replace(regexp_replace(iso.name, '\s*\[[^]]*\]', '', 'g'), '\s*\*+$', '')) AS name
  ) r
  WHERE r.name <> ''
  AND iso.iso ~ '^[A-Z]{2}-[A-Z0-9]{1,3}$'
  AND split_part(iso.iso, '-', 1) IN (SELECT code FROM country)
),
member AS MATERIALIZED (
  SELECT 'country'::text AS hub_type, pl.country AS hub_key, pl.cave_id
  FROM place pl
  WHERE pl.country IN (SELECT code FROM country)
  UNION
  SELECT 'region'::text, pl.region_code, pl.cave_id
  FROM place pl
  WHERE pl.region_code IN (SELECT code FROM region)
),
ranked AS MATERIALIZED (
  SELECT
    m.hub_type, m.hub_key, c.cave_id, c.name, c.depth, c.length, c.language, c.lastmod,
    row_number() OVER (
      PARTITION BY m.hub_type, m.hub_key
      ORDER BY c.doc_chars DESC, c.facts DESC, c.cave_id
    ) AS rn
  FROM member m
  JOIN cave c ON c.cave_id = m.cave_id
),
hub AS MATERIALIZED (
  SELECT
    r.hub_type, r.hub_key,
    max(r.lastmod) AS lastmod,
    jsonb_agg(
      jsonb_build_object('id', r.cave_id, 'name', r.name, 'depth', r.depth, 'length', r.length)
      ORDER BY r.rn
    ) FILTER (WHERE r.rn <= 100) AS caves
  FROM ranked r
  GROUP BY r.hub_type, r.hub_key
),
-- The most common language among the hub's caves; the lowest code on a tie
hub_language AS MATERIALIZED (
  SELECT DISTINCT ON (l.hub_type, l.hub_key) l.hub_type, l.hub_key, l.language
  FROM (
    SELECT r.hub_type, r.hub_key, r.language::text AS language, count(*) AS n
    FROM ranked r
    WHERE r.language IS NOT NULL
    GROUP BY r.hub_type, r.hub_key, r.language::text
  ) l
  ORDER BY l.hub_type, l.hub_key, l.n DESC, l.language COLLATE "C"
),
hub_massif AS MATERIALIZED (
  SELECT x.hub_type, x.hub_key,
         jsonb_agg(jsonb_build_object('id', x.id, 'name', x.name) ORDER BY x.id) AS items
  FROM (
    SELECT DISTINCT m.hub_type, m.hub_key, (mm->>'id')::int AS id, mm->>'name' AS name
    FROM member m
    JOIN cave c ON c.cave_id = m.cave_id
    CROSS JOIN LATERAL jsonb_array_elements(c.massifs) mm
  ) x
  GROUP BY x.hub_type, x.hub_key
),
country_region AS MATERIALIZED (
  SELECT rg.country,
         jsonb_agg(jsonb_build_object('code', rg.code, 'name', rg.name) ORDER BY rg.code) AS items
  FROM region rg
  WHERE rg.code IN (SELECT hub_key FROM hub WHERE hub_type = 'region')
  GROUP BY rg.country
)
SELECT
  'country'::text AS hub_type,
  h.hub_key::text AS hub_key,
  hl.language,
  h.lastmod,
  jsonb_build_object(
    'code', h.hub_key,
    'language', hl.language,
    'lastmod', h.lastmod,
    'regions', COALESCE(cr.items, '[]'::jsonb),
    'massifs', COALESCE(hm.items, '[]'::jsonb),
    'caves', h.caves
  ) AS page
FROM hub h
LEFT JOIN hub_language hl ON hl.hub_type = h.hub_type AND hl.hub_key = h.hub_key
LEFT JOIN hub_massif hm ON hm.hub_type = h.hub_type AND hm.hub_key = h.hub_key
LEFT JOIN country_region cr ON cr.country = h.hub_key
WHERE h.hub_type = 'country'

UNION ALL

SELECT
  'region'::text,
  h.hub_key::text,
  hl.language,
  h.lastmod,
  jsonb_build_object(
    'code', h.hub_key,
    'name', rg.name,
    'country', rg.country,
    'language', hl.language,
    'lastmod', h.lastmod,
    'massifs', COALESCE(hm.items, '[]'::jsonb),
    'caves', h.caves
  )
FROM hub h
JOIN region rg ON rg.code = h.hub_key
LEFT JOIN hub_language hl ON hl.hub_type = h.hub_type AND hl.hub_key = h.hub_key
LEFT JOIN hub_massif hm ON hm.hub_type = h.hub_type AND hm.hub_key = h.hub_key
WHERE h.hub_type = 'region'

UNION ALL

SELECT
  'index'::text,
  'ALL'::text,
  -- The index is about every country: its language is fixed (English), not the
  -- dominant one of all caves, which would make it French and could flip
  'eng'::text AS language,
  x.lastmod,
  jsonb_build_object(
    'language', 'eng',
    'lastmod', x.lastmod,
    'countries', x.items
  )
FROM (
  SELECT max(h.lastmod) AS lastmod,
         jsonb_agg(jsonb_build_object('code', h.hub_key) ORDER BY h.hub_key) AS items
  FROM hub h
  WHERE h.hub_type = 'country'
) x
WHERE x.items IS NOT NULL;
ALTER VIEW v_bot_hub OWNER TO gc_owner;
