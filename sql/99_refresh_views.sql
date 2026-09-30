\c grottoce;
-- refresh v_massif_info
REFRESH MATERIALIZED VIEW v_massif_info;

-- refresh v_country_info
REFRESH MATERIALIZED VIEW v_country_info;

-- refresh v_region_info
-- 91_materialized_views.sql recreates this one WITH NO DATA, so this refresh is
-- also what lets zz_ownership_and_grants.sql end in a CONCURRENTLY refresh of it
-- to verify the gc_owner TEMPORARY grant. See issue #1839.
REFRESH MATERIALIZED VIEW v_region_info;

-- refresh v_data_quality_compute_entrance
REFRESH MATERIALIZED VIEW v_data_quality_compute_entrance;

-- refresh v_bibliographic_metadata
REFRESH MATERIALIZED VIEW v_bibliographic_metadata;
