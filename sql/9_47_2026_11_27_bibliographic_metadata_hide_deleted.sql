\c grottoce;

-- =============================================================================
-- #2056: the bibliographic export must not publish deleted, merged or
-- unmoderated documents
-- =============================================================================
--
-- Until now v_bibliographic_metadata exported every row of t_document as a live
-- record. Now:
--   * a validated, not deleted, not merged document is exported in full, with
--     metadata_status = 'registered';
--   * a deleted or merged document that was validated once is exported as a
--     tombstone: metadata_status = 'deleted', its id, OAI identifier, sets,
--     dates and landing page URL are kept, every content column is emptied;
--   * a pending or refused document (not validated, not deleted) is left out;
--   * children and parents only list live documents;
--   * last_update of a tombstone is the later of date_validation and
--     date_reviewed, so a harvester sees the deletion as a change.
--
-- Same method as 9_45 and 9_46: the replacement is built and populated under
-- another name, indexed, given the same owner and grants, then swapped in by
-- renames in one short transaction (AGENTS.md: never a plain REFRESH or
-- DROP + CREATE). The columns do not change.
--
-- Compatible with the running API (same columns), so the order does not
-- matter. Production does not run migrations on deploy: apply it by hand,
-- outside 04:20-05:10 UTC and Azure's Saturday 03:00 UTC window. If the
-- lock_timeout of the swap fires, run the file again: the rebuild is repeated,
-- the swap is skipped once done.

DROP MATERIALIZED VIEW IF EXISTS v_bibliographic_metadata_new;

CREATE MATERIALIZED VIEW v_bibliographic_metadata_new AS
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
    JOIN t_document d_child ON d_child.id = dc.child
      AND d_child.is_validated AND NOT d_child.is_deleted AND d_child.redirect_to IS NULL
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
    JOIN t_document d_parent ON d_parent.id = dp.parent
      AND d_parent.is_validated AND NOT d_parent.is_deleted AND d_parent.redirect_to IS NULL
    LEFT JOIN t_type tt_parent ON tt_parent.id = d_parent.id_type
    GROUP BY dp.child
),
base AS (
  SELECT
      (d.is_deleted OR d.redirect_to IS NOT NULL) AS is_gone,
      GREATEST(d.date_validation, d.date_reviewed) AS date_change,
      d.id as id_document,
      COALESCE(ca.children, ARRAY[]::jsonb[]) AS children,
      COALESCE(pa.parents, ARRAY[]::jsonb[]) AS parents,
      'oai:grottocenter.org:' || d.id as oai_identifier,
      d.date_validation as last_update_live,
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
      'https://grottocenter.org/ui/documents/' || d.id as landing_page_url,
      NULLIF(lic.url, '') as dc_license_url,
      d.date_inscription as creation_date
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
    AND (
      (d.is_validated AND NOT d.is_deleted AND d.redirect_to IS NULL)
      OR ((d.is_deleted OR d.redirect_to IS NOT NULL) AND d.date_validation IS NOT NULL)
    )
  GROUP BY
    d.id,
    d.date_validation,
    d.date_reviewed,
    d.is_deleted,
    d.redirect_to,
    d.date_inscription,
    d.date_publication,
    d.identifier,
    idtype.code,
    d.id_parent,
    author.nickname,
    tn.name,
    lic.name,
    lic.url,
    tt.name,
    ca.children,
    pa.parents,
    d.pages
)
SELECT
    id_document,
    CASE WHEN is_gone THEN ARRAY[]::jsonb[] ELSE children END AS children,
    CASE WHEN is_gone THEN ARRAY[]::jsonb[] ELSE parents END AS parents,
    oai_identifier,
    CASE WHEN is_gone THEN date_change ELSE last_update_live END AS last_update,
    list_sets,
    CASE WHEN is_gone THEN NULL ELSE dc_title END AS dc_title,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_creators END AS dc_creators,
    CASE WHEN is_gone THEN NULL ELSE dc_contributor END AS dc_contributor,
    CASE WHEN is_gone THEN NULL ELSE dc_publisher END AS dc_publisher,
    CASE WHEN is_gone THEN NULL ELSE dc_date END AS dc_date,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_languages END AS dc_languages,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_descriptions END AS dc_descriptions,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_coverages END AS dc_coverages,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_subjects END AS dc_subjects,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_formats END AS dc_formats,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_identifiers END AS dc_identifiers,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_relations END AS dc_relations,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_sources END AS dc_sources,
    CASE WHEN is_gone THEN ARRAY[]::text[] ELSE dc_rights END AS dc_rights,
    dc_type_grottocenter,
    dc_type_dcmi,
    CASE WHEN is_gone THEN NULL ELSE dc_pages END AS dc_pages,
    has_been_updated,
    (CASE WHEN is_gone THEN 'deleted' ELSE 'registered' END)::e_metadata_status AS metadata_status,
    landing_page_url,
    CASE WHEN is_gone THEN NULL ELSE dc_license_url END AS dc_license_url,
    creation_date
  FROM base
WITH DATA;

-- Index names are schema-wide: distinct names now, renamed in the swap.
CREATE UNIQUE INDEX idx_v_biblio_new_id ON v_bibliographic_metadata_new(id_document);
CREATE INDEX idx_v_biblio_new_status ON v_bibliographic_metadata_new(metadata_status);
CREATE INDEX idx_v_biblio_new_oai_id ON v_bibliographic_metadata_new(oai_identifier);
CREATE INDEX idx_v_biblio_new_last_update ON v_bibliographic_metadata_new(last_update);
CREATE INDEX idx_v_biblio_new_sets ON v_bibliographic_metadata_new USING gin(list_sets);

ALTER MATERIALIZED VIEW v_bibliographic_metadata_new OWNER TO gc_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON v_bibliographic_metadata_new TO gc_app;
GRANT SELECT ON v_bibliographic_metadata_new TO gc_readonly;

BEGIN;
SET LOCAL lock_timeout = '3s';

DO $swap$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews
    WHERE schemaname = 'public' AND matviewname = 'v_bibliographic_metadata'
      AND definition LIKE '%is_gone%'
  ) THEN
    RAISE NOTICE 'v_bibliographic_metadata already hides deleted documents, swap skipped';
    DROP MATERIALIZED VIEW v_bibliographic_metadata_new;
  ELSE
    ALTER MATERIALIZED VIEW v_bibliographic_metadata RENAME TO v_bibliographic_metadata_old;
    ALTER MATERIALIZED VIEW v_bibliographic_metadata_new RENAME TO v_bibliographic_metadata;
    DROP MATERIALIZED VIEW v_bibliographic_metadata_old;
    ALTER INDEX idx_v_biblio_new_id RENAME TO idx_v_biblio_id;
    ALTER INDEX idx_v_biblio_new_status RENAME TO idx_v_biblio_status;
    ALTER INDEX idx_v_biblio_new_oai_id RENAME TO idx_v_biblio_oai_id;
    ALTER INDEX idx_v_biblio_new_last_update RENAME TO idx_v_biblio_last_update;
    ALTER INDEX idx_v_biblio_new_sets RENAME TO idx_v_biblio_sets;
  END IF;
END
$swap$;

COMMIT;
