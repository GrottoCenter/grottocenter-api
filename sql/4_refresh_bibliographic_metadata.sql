-- -----------------------------------------------------------------------------
-- 4_refresh_bibliographic_metadata.sql
--
-- Recompute and fill t_bibliographic_metadata from existing data
-- -----------------------------------------------------------------------------

\c grottoce;

TRUNCATE TABLE t_bibliographic_metadata;

INSERT INTO t_bibliographic_metadata (
  id_document,
  oai_identifier,
  last_update,
  list_sets,
  dc_title,
  dc_creators,
  dc_contributor,
  dc_publisher,
  dc_date,
  dc_languages,
  dc_descriptions,
  dc_coverages,
  dc_subjects,
  dc_formats,
  dc_identifiers,
  dc_relations,
  dc_sources,
  dc_rights,
  dc_types,
  has_been_updated,
  metadata_status
)
SELECT
  d.id,
  'oai:grottocenter.org:' || d.id,
  d.date_validation,
  ARRAY[
    'grottocenter',
    'grottocenter:' || lower(regexp_replace(tt.name, '\s+', '_', 'g'))
  ],
  NULLIF(MAX(btrim(td.title)), ''),
  COALESCE(
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(btrim(cav.nickname), '')), NULL),
    ARRAY[]::text[]
  ),
  NULLIF(btrim(author.nickname), ''),
  NULLIF(btrim(tn.name), ''),
  CASE
    WHEN d.date_publication ~ '^\d{4}$' THEN TO_DATE(d.date_publication || '-01-01', 'YYYY-MM-DD')
    WHEN d.date_publication ~ '^\d{4}-\d{2}-\d{2}$' THEN CAST(d.date_publication AS DATE)
    ELSE NULL
  END,
  COALESCE(
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT j_lang.id_language), NULL),
    ARRAY[]::text[]
  ),
  COALESCE(
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(btrim(td.body), '')), NULL),
    ARRAY[]::text[]
  ),
  COALESCE(
    ARRAY_CAT(
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT iso.id_iso), NULL),
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT country.id_country), NULL)
    ),
    ARRAY[]::text[]
  ),
  COALESCE(
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(btrim(s.subject), '')), NULL),
    ARRAY[]::text[]
  ),
  COALESCE(
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(f.path, '')), NULL),
    ARRAY[]::text[]
  ),
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
  ),
  CASE
    WHEN d.id_parent IS NOT NULL THEN ARRAY['oai:grottocenter.org:' || d.id_parent]
    ELSE ARRAY[]::text[]
  END,
  ARRAY['Bulletin Bibliographique Spéléologique / Speleo Abstracts'],
  COALESCE(
    ARRAY[NULLIF(lic.name, '')],
    ARRAY[]::text[]
  ),
  ARRAY[
    CASE
      WHEN tt.name ILIKE 'Image' THEN 'image'
      WHEN tt.name ILIKE 'Still Image' THEN 'image'
      WHEN tt.name ILIKE 'Map' THEN 'image'
      WHEN tt.name ILIKE 'Topographic Drawing' THEN 'image'
      WHEN tt.name ILIKE 'Moving Image' THEN 'video'
      WHEN tt.name ILIKE 'Sound' THEN 'sound'
      WHEN tt.name ILIKE 'Dataset' THEN 'dataset'
      WHEN tt.name ILIKE 'Text' THEN 'text'
      WHEN tt.name ILIKE 'Article' THEN 'text'
      WHEN tt.name ILIKE 'Book' THEN 'text'
      WHEN tt.name ILIKE 'Issue' THEN 'text'
      WHEN tt.name ILIKE 'Report' THEN 'text'
      WHEN tt.name ILIKE 'Authorization To Publish' THEN 'text'
      ELSE 'text'
    END
  ],
  false,
  'registered'::e_metadata_status
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
  tt.name;

