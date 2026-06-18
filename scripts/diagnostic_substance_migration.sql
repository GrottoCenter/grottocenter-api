\c grottoce;

-- ============================================================
-- Diagnostic Script: Substance Label Migration Analysis
-- ============================================================
--
-- PURPOSE:
-- This script is a READ-ONLY diagnostic tool for administrators.
-- It identifies all distinct free-text substance_label values that
-- exist in t_sensor_configuration and t_time_series, along with
-- their row counts.
--
-- This information helps an administrator manually map historical
-- free-text values to records in the t_substance reference table
-- by crafting UPDATE statements based on the templates below.
--
-- WORKFLOW:
-- 1. Run this script against the production database (read-only)
-- 2. Review the distinct substance_label values and their counts
-- 3. For each label, identify the matching t_substance record
--    (by name or by searching PubChem if not pre-seeded)
-- 4. If a matching t_substance record does not exist, create one
--    via POST /api/v1/substances
-- 5. Uncomment and adapt the template UPDATE statements below,
--    replacing the placeholder values with actual data
-- 6. Run the UPDATEs in a transaction against the target database
-- 7. Verify the migration by re-running the diagnostic queries
--    (rows with non-null substance_label but null id_substance
--    indicate unmigrated records)
--
-- WARNING:
-- This script performs NO inserts, updates, or deletes.
-- It is intended for human review only.
-- ============================================================

-- ============================================================
-- 1. Distinct substance_label values in t_sensor_configuration
--    with row counts, ordered by frequency (most common first)
-- ============================================================
SELECT
  substance_label,
  COUNT(*) AS row_count
FROM t_sensor_configuration
WHERE substance_label IS NOT NULL
GROUP BY substance_label
ORDER BY row_count DESC, substance_label ASC;

-- ============================================================
-- 2. Distinct substance_label values in t_time_series
--    with row counts, ordered by frequency (most common first)
-- ============================================================
SELECT
  substance_label,
  COUNT(*) AS row_count
FROM t_time_series
WHERE substance_label IS NOT NULL
GROUP BY substance_label
ORDER BY row_count DESC, substance_label ASC;

-- ============================================================
-- 3. Template UPDATE statements for manual migration
-- ============================================================
--
-- After identifying the correct t_substance.id for each
-- substance_label value, uncomment and adapt these templates.
--
-- Step A: Update t_sensor_configuration
--   For each distinct substance_label, set id_substance to the
--   matching t_substance record ID.
--
-- UPDATE t_sensor_configuration
-- SET id_substance = <substance_id>
-- WHERE substance_label = '<substance_label_value>'
--   AND id_substance IS NULL;
--
-- Example:
-- UPDATE t_sensor_configuration
-- SET id_substance = 1
-- WHERE substance_label = 'Nitrate'
--   AND id_substance IS NULL;
--
-- Step B: Update t_time_series
--   Mirror the same mapping for time series records.
--
-- UPDATE t_time_series
-- SET id_substance = <substance_id>
-- WHERE substance_label = '<substance_label_value>'
--   AND id_substance IS NULL;
--
-- Example:
-- UPDATE t_time_series
-- SET id_substance = 1
-- WHERE substance_label = 'Nitrate'
--   AND id_substance IS NULL;
--
-- NOTES:
-- - Always run UPDATEs inside a transaction (BEGIN; ... COMMIT;)
-- - The WHERE clause includes "AND id_substance IS NULL" to avoid
--   overwriting records that have already been migrated
-- - After migration, substance_label remains as-is for backward
--   compatibility and BI query performance
-- - Future sensor configuration creates/updates will automatically
--   populate both id_substance and substance_label via the API
-- ============================================================
