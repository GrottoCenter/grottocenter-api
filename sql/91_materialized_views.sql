\c grottoce;
-- v_massif_info definition
-- not populated, (WITH NO DATA), the schema only
DROP MATERIALIZED VIEW IF EXISTS v_massif_info;
CREATE MATERIALIZED VIEW v_massif_info AS
  SELECT m.id as id_massif,
  c.id as id_cave,
  n.name as name_cave,
  c.depth as depth_cave,
  c.length as length_cave,
  c.is_diving as is_diving_cave,
  COUNT(DISTINCT e.id) as nb_entrances
  FROM t_massif m
  JOIN t_entrance e ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  AND e.is_deleted = false
  JOIN t_cave c ON e.id_cave = c.id AND c.is_deleted = false
  JOIN t_name n ON n.id_cave = c.id AND n.is_main = true
  WHERE m.is_deleted = false
  GROUP BY(m.id, c.id, n.name, c.depth, c.length, c.is_diving)
WITH NO DATA;

-- v_country_info definition
-- not populated, (WITH NO DATA), the schema only
DROP MATERIALIZED VIEW IF EXISTS v_country_info;
CREATE MATERIALIZED VIEW v_country_info AS
  SELECT e.id_country as id_country,
  c.id as id_cave,
  n.name as name_cave,
  c.depth as depth_cave,
  c.length as length_cave,
  c.is_diving as is_diving_cave,
  COUNT(e.id) as nb_entrances,
  m.id as id_massif
  FROM t_entrance e
  LEFT JOIN t_cave c ON e.id_cave = c.id AND c.is_deleted = false
  LEFT JOIN t_name n ON n.id_cave = c.id AND n.is_main = true
  LEFT JOIN t_massif m ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  AND m.is_deleted = false
  WHERE e.is_deleted = false
  GROUP BY(e.id_country, c.id, n.name, c.depth, c.length, c.is_diving, m.id)
  WITH NO DATA;

-- v_region_info definition
-- not populated, (WITH NO DATA), the schema only
DROP MATERIALIZED VIEW IF EXISTS v_region_info;
CREATE MATERIALIZED VIEW v_region_info AS
  SELECT e.iso_3166_2 as id_region,
  c.id as id_cave,
  n.name as name_cave,
  c.depth as depth_cave,
  c.length as length_cave,
  c.is_diving as is_diving_cave,
  COUNT(e.id) as nb_entrances,
  m.id as id_massif
  FROM t_entrance e
  LEFT JOIN t_cave c ON e.id_cave = c.id AND c.is_deleted = false
  LEFT JOIN t_name n ON n.id_cave = c.id AND n.is_main = true
  LEFT JOIN t_massif m ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  AND m.is_deleted = false
  WHERE e.is_deleted = false
  AND e.iso_3166_2 IS NOT NULL
  GROUP BY(e.iso_3166_2, c.id, n.name, c.depth, c.length, c.is_diving, m.id)
  WITH NO DATA;

-- v_data_quality_compute_entrance definition
-- not populated, (WITH NO DATA), the schema only
DROP MATERIALIZED VIEW IF EXISTS v_data_quality_compute_entrance;
CREATE MATERIALIZED VIEW v_data_quality_compute_entrance AS
  SELECT e.id as id_entrance,
  GREATEST(e.date_inscription, e.date_reviewed) as general_latest_date_of_update,
  (COUNT(DISTINCT e.date_inscription)+ COUNT(DISTINCT e.date_reviewed)) as general_nb_contributions,

  GREATEST(MAX(l.date_inscription), MAX(l.date_reviewed)) as location_latest_date_of_update,
  (COUNT(DISTINCT l.date_inscription)+ COUNT(DISTINCT l.date_reviewed)) as location_nb_contributions,

  GREATEST(MAX(d.date_inscription), MAX(d.date_reviewed)) as description_latest_date_of_update,
  (COUNT(DISTINCT d.date_inscription)+ COUNT(DISTINCT d.date_reviewed)) as description_nb_contributions,

  GREATEST(MAX(doc.date_inscription), MAX(doc.date_reviewed)) as document_latest_date_of_update,
  (COUNT(DISTINCT doc.date_inscription)+ COUNT(DISTINCT doc.date_reviewed)) as document_nb_contributions,

  GREATEST(MAX(r.date_inscription), MAX(r.date_reviewed)) as rigging_latest_date_of_update,
  (COUNT(DISTINCT r.date_inscription)+ COUNT(DISTINCT r.date_reviewed)) as rigging_nb_contributions,

  GREATEST(MAX(h.date_inscription), MAX(h.date_reviewed)) as history_latest_date_of_update,
  (COUNT(DISTINCT h.date_inscription)+ COUNT(DISTINCT h.date_reviewed)) as history_nb_contributions,

  GREATEST(MAX(c.date_inscription), MAX(c.date_reviewed)) as comment_latest_date_of_update,
  (COUNT(DISTINCT c.date_inscription)+ COUNT(DISTINCT c.date_reviewed)) as comment_nb_contributions,

  m.id as id_massif,
  n.name as entrance_name,
  nn.name as massif_name,
  e.id_country as id_country,
  co.fr_name as country_name,
  NOW() as date_of_update

  FROM t_entrance e
  LEFT JOIN t_country co ON co.iso = e.id_country
  LEFT JOIN t_location l ON e.id = l.id_entrance
  LEFT JOIN t_description d ON e.id = d.id_entrance
  LEFT JOIN j_document_entrance jde ON e.id = jde.id_entrance
  LEFT JOIN t_document doc ON jde.id_document = doc.id
  LEFT JOIN t_rigging r ON e.id = r.id_entrance
  LEFT JOIN t_history h ON e.id = h.id_entrance
  LEFT JOIN t_comment c ON e.id = c.id_entrance
  LEFT JOIN t_name n ON e.id = n.id_entrance
  LEFT JOIN t_massif m ON e.point_geom && m.geog_polygon AND ST_Contains(m.geog_polygon::geometry, e.point_geom)
  LEFT JOIN (SELECT * FROM t_name WHERE is_main = true) nn ON m.id = nn.id_massif
  WHERE n.is_main = true
  AND e.is_deleted = false
  GROUP BY e.id, m.id, n.name, nn.name, co.fr_name
  WITH NO DATA;

-- v_bibliographic_metadata definition
-- not populated, (WITH NO DATA), the schema only
DROP MATERIALIZED VIEW IF EXISTS v_bibliographic_metadata;
CREATE MATERIALIZED VIEW v_bibliographic_metadata AS
WITH RECURSIVE doc_children(root, child, level) AS (
    -- Base case: direct children (level 1)
    SELECT
        id_parent as root,
        id as child,
        1 as level
    FROM t_document
    WHERE id_parent IS NOT NULL

    UNION ALL

    -- Recursive case: add level tracking and limit depth
    SELECT
        dc.root,
        d.id,
        dc.level + 1
    FROM t_document d
    JOIN doc_children dc ON d.id_parent = dc.child
    WHERE dc.level < 100  -- Prevent infinite recursion and limit depth
),
doc_parents(child, parent, level) AS (
    -- Base case: direct parents (level 1)
    SELECT
        id as child,
        id_parent as parent,
        1 as level
    FROM t_document
    WHERE id_parent IS NOT NULL

    UNION ALL

    -- Recursive case: add level tracking and limit depth
    SELECT
        dp.child,
        d.id_parent,
        dp.level + 1
    FROM t_document d
    JOIN doc_parents dp ON d.id = dp.parent
    WHERE dp.level < 100 AND d.id_parent IS NOT NULL  -- Prevent infinite recursion and limit depth
),
children_agg AS (
    SELECT
        dc.root AS id_document,
        ARRAY_AGG(
            jsonb_build_object(
                'id', dc.child,
                'dcTitle', NULLIF(btrim(td_child.title), ''),
                'dcTypeGrottocenter', lower(regexp_replace(tt_child.name, '\s+', '_', 'g'))
            ) ORDER BY dc.level, dc.child
        ) AS children
    FROM doc_children dc
    LEFT JOIN t_description td_child ON td_child.id_document = dc.child
    LEFT JOIN t_document d_child ON d_child.id = dc.child
    LEFT JOIN t_type tt_child ON tt_child.id = d_child.id_type
    GROUP BY dc.root
),
parents_agg AS (
    SELECT
        dp.child AS id_document,
        ARRAY_AGG(
            jsonb_build_object(
                'id', dp.parent,
                'dcTitle', NULLIF(btrim(td_parent.title), ''),
                'dcTypeGrottocenter', lower(regexp_replace(tt_parent.name, '\s+', '_', 'g'))
            ) ORDER BY dp.level, dp.parent
        ) AS parents
    FROM doc_parents dp
    LEFT JOIN t_description td_parent ON td_parent.id_document = dp.parent
    LEFT JOIN t_document d_parent ON d_parent.id = dp.parent
    LEFT JOIN t_type tt_parent ON tt_parent.id = d_parent.id_type
    GROUP BY dp.child
)
SELECT
    d.id as id_document,
    COALESCE(ca.children, ARRAY[]::jsonb[]) AS children,
    COALESCE(pa.parents, ARRAY[]::jsonb[]) AS parents,
    'oai:grottocenter.org:' || d.id as oai_identifier,
    d.date_validation as last_update,
    ARRAY[
      'grottocenter',
      'grottocenter:' || lower(regexp_replace(tt.name, '\s+', '_', 'g'))
    ] as list_sets,
    NULLIF(MAX(btrim(td.title)), '') as dc_title,
    COALESCE(
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(btrim(cav.nickname), '')), NULL),
      ARRAY[]::text[]
    ) as dc_creators,
    NULLIF(btrim(author.nickname), '') as dc_contributor,
    NULLIF(btrim(tn.name), '') as dc_publisher,
    CASE
      WHEN d.date_publication ~ '^\d{4}$' THEN TO_DATE(d.date_publication || '-01-01', 'YYYY-MM-DD')
      WHEN d.date_publication ~ '^\d{4}-\d{2}-\d{2}$' THEN CAST(d.date_publication AS DATE)
      ELSE NULL
    END as dc_date,
    COALESCE(
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT j_lang.id_language), NULL),
      ARRAY[]::text[]
    ) as dc_languages,
    COALESCE(
      ARRAY_REMOVE(
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(btrim(td.body), '')), NULL),
        NULL
      ),
      ARRAY[]::text[]
    ) as dc_descriptions,
    COALESCE(
      ARRAY_CAT(
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT iso.id_iso), NULL),
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT country.id_country), NULL)
      ),
      ARRAY[]::text[]
    ) as dc_coverages,
    COALESCE(
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(btrim(s.subject), '')), NULL),
      ARRAY[]::text[]
    ) as dc_subjects,
    COALESCE(
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(f.path, '')), NULL),
      ARRAY[]::text[]
    ) as dc_formats,
    COALESCE(
      ARRAY_REMOVE(
        ARRAY_CAT(
          ARRAY[
            CASE
              WHEN idtype.code = 'doi' THEN 'doi:' || d.identifier
              WHEN idtype.code = 'isbn' THEN 'isbn:' || d.identifier
              WHEN idtype.code = 'issn' THEN 'issn:' || d.identifier
              WHEN idtype.code = 'url' THEN d.identifier
              ELSE NULL
            END
          ],
          ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(f.path, '')), NULL)
        ),
        NULL
      ),
      ARRAY[]::text[]
    ) as dc_identifiers,
    CASE
      WHEN d.id_parent IS NOT NULL THEN ARRAY['oai:grottocenter.org:' || d.id_parent]
      ELSE ARRAY[]::text[]
    END as dc_relations,
    ARRAY['Bulletin Bibliographique Spéléologique / Speleo Abstracts'] as dc_sources,
    COALESCE(
      ARRAY[NULLIF(lic.name, '')],
      ARRAY[]::text[]
    ) as dc_rights,
    lower(regexp_replace(tt.name, '\s+', '_', 'g')) as dc_type_grottocenter,
    CASE
      WHEN tt.name ILIKE 'Image' THEN 'image'
      WHEN tt.name ILIKE 'Still Image' THEN 'image'
      WHEN tt.name ILIKE 'Map' THEN 'image'
      WHEN tt.name ILIKE 'Topographic Drawing' THEN 'image'
      WHEN tt.name ILIKE 'Moving Image' THEN 'moving image'
      WHEN tt.name ILIKE 'Sound' THEN 'sound'
      WHEN tt.name ILIKE 'Dataset' THEN 'dataset'
      WHEN tt.name ILIKE 'Interactive Resource' THEN 'interactive resource'
      WHEN tt.name ILIKE 'Physical Object' THEN 'physical object'
      WHEN tt.name ILIKE 'Collection' THEN 'collection'
      ELSE 'text'
    END as dc_type_dcmi,
    d.pages as dc_pages,
    false as has_been_updated,
    'registered'::e_metadata_status as metadata_status
  FROM t_document d
  LEFT JOIN t_description td ON td.id_document = d.id
  LEFT JOIN j_document_caver_author jca ON jca.id_document = d.id
  LEFT JOIN t_caver cav ON cav.id = jca.id_caver
  LEFT JOIN t_caver author ON author.id = d.id_author
  LEFT JOIN t_grotto editor ON editor.id = d.id_editor
  LEFT JOIN t_name tn ON tn.id_grotto = d.id_editor
  LEFT JOIN j_document_language j_lang ON j_lang.id_document = d.id
  LEFT JOIN j_document_iso3166_2 iso ON iso.id_document = d.id
  LEFT JOIN j_document_country country ON country.id_document = d.id
  LEFT JOIN j_document_subject js ON js.id_document = d.id
  LEFT JOIN t_subject s ON s.code = js.code_subject
  LEFT JOIN t_file f ON f.id_document = d.id
  LEFT JOIN t_license lic ON lic.id = d.id_license
  LEFT JOIN t_type tt ON tt.id = d.id_type
  LEFT JOIN t_identifier_type idtype ON idtype.code = d.id_identifier_type
  LEFT JOIN children_agg ca ON ca.id_document = d.id
  LEFT JOIN parents_agg pa ON pa.id_document = d.id
  WHERE d.id IS NOT NULL
  GROUP BY
    d.id,
    d.date_validation,
    d.date_publication,
    d.identifier,
    idtype.code,
    d.id_parent,
    author.nickname,
    tn.name,
    lic.name,
    tt.name,
    ca.children,
    pa.parents,
    d.pages
  WITH NO DATA;

CREATE UNIQUE INDEX ON v_data_quality_compute_entrance(id_massif, id_entrance);
CREATE INDEX IF NOT EXISTS idx_vdqce_entrance_massif ON v_data_quality_compute_entrance (id_entrance, id_massif);
CREATE UNIQUE INDEX ON v_massif_info(id_massif, id_cave);
-- id_country is part of the GROUP BY key, so a cave that spans two countries inside the same massif
-- produces two rows with distinct id_country but the same (id_massif, id_cave) pair.
-- The index must include id_country to remain unique across all rows.
CREATE UNIQUE INDEX ON v_country_info(id_country, id_massif, id_cave);
CREATE UNIQUE INDEX ON v_region_info(id_massif, id_cave, id_region);
