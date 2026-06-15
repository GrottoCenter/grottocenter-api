\c grottoce;

-- Drop indexes with 0 scans over 11 months (since 2024-07-21 stats_reset).
-- They add write overhead on t_entrance without any read benefit.
DROP INDEX IF EXISTS idx_t_entrance_of_interest;
DROP INDEX IF EXISTS idx_t_entrance_country_active;

-- Drop unused indexes on other tables (0 scans in 11 months).
-- idx_h_name_id: h_name has 0 idx_scans total, this index is never used.
DROP INDEX IF EXISTS idx_h_name_id;

-- idx_time_series_date_range: never used since creation.
DROP INDEX IF EXISTS idx_time_series_date_range;

-- idx_quantity_kind_code: never used since creation.
DROP INDEX IF EXISTS idx_quantity_kind_code;

-- idx_t_message_sender: never used, t_message has only 205 rows.
DROP INDEX IF EXISTS idx_t_message_sender;

-- idx_point_geom: never used, t_point has very few rows.
DROP INDEX IF EXISTS idx_point_geom;

-- idx_tsql_time_series: never used since creation.
DROP INDEX IF EXISTS idx_tsql_time_series;
