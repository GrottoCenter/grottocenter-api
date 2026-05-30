# Strategy: Graduated Analytics Layer for Superset Integration

Assumes all ERD changes from `BI_ERD_CHANGES.md` are applied (denormalized codes on transactional tables, partitioned `t_measurement`, indexed date range, enum constraint).

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Transactional Layer (API reads/writes)                          │
│                                                                  │
│  t_observation   + observation_type_code, point_label, lat, lng  │
│  t_time_series   + quantity_kind_code, unit_symbol, medium_code  │
│  t_measurement   partitioned by timestamp                        │
│  t_contamination + medium_code                                   │
│                                                                  │
│  Normalized + selectively denormalized                           │
└───────────────────────────┬──────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────────┐
          │                 │                     │
          ▼                 ▼                     ▼
┌───────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│ Phase 1 (launch)  │ │ Phase 2 (scale)  │ │ Summary views       │
│                   │ │                  │ │                     │
│ v_measurement_wide│ │ fact_measurement │ │ mv_observation_     │
│ (regular view,    │ │ (trigger-        │ │   summary           │
│  2 JOINs,         │ │  maintained,     │ │ mv_contamination_   │
│  < 10M rows)      │ │  10M–100M rows)  │ │   geo               │
│                   │ │                  │ │ (refreshed hourly)  │
└────────┬──────────┘ └────────┬─────────┘ └─────────────────────┘
         │                     │
         └──────────┬──────────┘
                    │ optional join (drill-down only)
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  Dimension Tables (optional)                                     │
│                                                                  │
│  dim_sensor          dim_point          dim_cave                 │
│  brand, precision,   full descriptions  cave_name, massif        │
│  detection limits                                                │
│                                                                  │
│  Small (< 1k rows), refreshed every 5 min                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Direct View (Launch — Up to ~10M Measurements)

No extra tables, no triggers. Superset queries a lightweight view directly on the partitioned transactional tables.

```sql
CREATE VIEW v_measurement_wide AS
SELECT
  m.id AS measurement_id,
  m.value,
  m.timestamp,
  ts.id AS time_series_id,
  ts.quantity_kind_code,
  ts.unit_symbol,
  ts.medium_code,
  ts.data_quality,
  ts.sampling_interval_seconds,
  o.id AS observation_id,
  o.observation_date,
  o.observation_type_code,
  o.point_label,
  o.latitude,
  o.longitude,
  COALESCE(o.id_cave, (SELECT id_cave FROM t_point WHERE id = o.id_point)) AS cave_id,
  ts.id_sensor
FROM t_measurement m
JOIN t_time_series ts ON ts.id = m.id_time_series
JOIN t_observation o ON o.id = ts.id_observation
WHERE o.is_deleted = false
  AND ts.is_deleted = false;
```

**Why this works at moderate scale:**

- `t_measurement` is partitioned by timestamp — Superset's time-range filter triggers partition pruning, scanning only relevant chunks.
- All filter/group-by columns (`quantity_kind_code`, `observation_type_code`, `medium_code`, `data_quality`) are already on the joined tables — no further joins needed.
- Geo columns (`latitude`, `longitude`) are on `t_observation` — single-dataset map charts work directly.
- Only 2 JOINs, both on indexed foreign keys.

**Superset registration:** Register `v_measurement_wide` as a dataset. Define metrics like:

- `AVG(value)` — "Average Reading"
- `COUNT(measurement_id)` — "Measurement Count"
- `MAX(value) - MIN(value)` — "Range"

---

## Phase 2: Fact Table (When Scale Exceeds ~10M Measurements)

When the view becomes too slow (query times > 2–3s for typical dashboard interactions), graduate to a trigger-maintained fact table.

### Fact Table Definition

```sql
CREATE TABLE fact_measurement (
  measurement_id BIGINT PRIMARY KEY,
  value NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  time_series_id INT NOT NULL,
  sensor_id INT NOT NULL,
  quantity_kind_code VARCHAR NOT NULL,
  unit_symbol VARCHAR NOT NULL,
  medium_code VARCHAR,
  data_quality VARCHAR,
  observation_id INT NOT NULL,
  observation_date TIMESTAMPTZ NOT NULL,
  observation_type_code VARCHAR NOT NULL,
  point_label VARCHAR,
  latitude NUMERIC(24,20),
  longitude NUMERIC(24,20),
  point_geom GEOMETRY(Point, 4326),
  cave_id INT
) PARTITION BY RANGE (timestamp);
```

### Simplified Trigger (2 JOINs Only)

```sql
CREATE OR REPLACE FUNCTION fn_sync_fact_measurement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO fact_measurement
  SELECT
    NEW.id,
    NEW.value,
    NEW.timestamp,
    ts.id,
    ts.id_sensor,
    ts.quantity_kind_code,
    ts.unit_symbol,
    ts.medium_code,
    ts.data_quality,
    o.id,
    o.observation_date,
    o.observation_type_code,
    o.point_label,
    o.latitude,
    o.longitude,
    o.point_geom,
    COALESCE(o.id_cave, (SELECT id_cave FROM t_point WHERE id = o.id_point))
  FROM t_time_series ts
  JOIN t_observation o ON o.id = ts.id_observation
  WHERE ts.id = NEW.id_time_series;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fact_measurement
AFTER INSERT ON t_measurement
FOR EACH ROW EXECUTE FUNCTION fn_sync_fact_measurement();
```

Compare to the pre-ERD-changes version: **2 JOINs instead of 8**. The trigger is fast and constant-time per insert.

### Handling Bulk Imports

For data logger dumps (100k+ measurements at once):

```sql
-- 1. Disable trigger during bulk load
ALTER TABLE t_measurement DISABLE TRIGGER trg_fact_measurement;

-- 2. Bulk COPY into t_measurement
COPY t_measurement (id_time_series, value, timestamp) FROM ...;

-- 3. Re-enable trigger
ALTER TABLE t_measurement ENABLE TRIGGER trg_fact_measurement;

-- 4. Batch-insert into fact table for the new rows
INSERT INTO fact_measurement
SELECT
  m.id, m.value, m.timestamp,
  ts.id, ts.id_sensor,
  ts.quantity_kind_code, ts.unit_symbol, ts.medium_code, ts.data_quality,
  o.id, o.observation_date, o.observation_type_code,
  o.point_label, o.latitude, o.longitude, o.point_geom,
  COALESCE(o.id_cave, (SELECT id_cave FROM t_point WHERE id = o.id_point))
FROM t_measurement m
JOIN t_time_series ts ON ts.id = m.id_time_series
JOIN t_observation o ON o.id = ts.id_observation
WHERE m.id > :last_known_id;
```

---

## Dimension Tables (Optional — For Drill-Down Only)

With codes denormalized onto the transactional tables, Superset can filter and group without any dimension joins. Dimensions are only needed for extended metadata drill-down:

| Dimension | Source | Content | When Needed |
|-----------|--------|---------|-------------|
| `dim_sensor` | `t_device` + `t_sensor_configuration` + `t_quantity_kind` + `t_unit` | brand, precision, detection limits, product URL | User clicks a time series → "show me sensor specs" |
| `dim_point` | `t_point` + `t_description` | full descriptions, cave association | User clicks a map marker → "show me point details" |
| `dim_cave` | `t_cave` + resolved main name | cave name, massif, depth, length | User filters by cave → "show me cave info" |

These are small tables (< 1k rows each). Refresh them every 5 minutes via cron — takes milliseconds.

Register them as joinable datasets in Superset (linked via `sensor_id`, `point_id`, `cave_id`).

---

## Summary Materialized Views (Hourly Refresh)

For overview dashboards that don't need per-measurement granularity:

### `mv_observation_summary`

```sql
CREATE MATERIALIZED VIEW mv_observation_summary AS
SELECT
  o.id AS observation_id,
  o.observation_date,
  o.observation_type_code,
  o.point_label,
  o.latitude,
  o.longitude,
  COALESCE(o.id_cave, (SELECT id_cave FROM t_point WHERE id = o.id_point)) AS cave_id,
  (SELECT COUNT(*) FROM t_time_series ts
   WHERE ts.id_observation = o.id AND ts.is_deleted = false) AS time_series_count,
  (SELECT COUNT(*) FROM t_contamination ct
   WHERE ct.id_observation = o.id AND ct.is_deleted = false) AS contamination_count,
  (SELECT COUNT(*) FROM t_human_activity ha
   WHERE ha.id_observation = o.id AND ha.is_deleted = false) AS human_activity_count
FROM t_observation o
WHERE o.is_deleted = false;
```

### `mv_contamination_geo`

```sql
CREATE MATERIALIZED VIEW mv_contamination_geo AS
SELECT
  c.id AS contamination_id,
  c.date_inscription,
  c.medium_code,
  ct.code AS contaminant_type_code,
  o.observation_date,
  o.observation_type_code,
  o.point_label,
  o.latitude,
  o.longitude,
  COALESCE(o.id_cave, (SELECT id_cave FROM t_point WHERE id = o.id_point)) AS cave_id
FROM t_contamination c
JOIN t_contaminant_type ct ON ct.id = c.id_contaminant_type
JOIN t_observation o ON o.id = c.id_observation
WHERE c.is_deleted = false AND o.is_deleted = false;
```

These are small (hundreds to low thousands of rows) and refresh in milliseconds.

---

## Graduation Path

| Scale | Approach | Infrastructure |
|-------|----------|---------------|
| Launch (< 10M measurements) | `v_measurement_wide` view + summary mat views | Zero extra tables, cron for mat views |
| Growth (10M–100M) | `fact_measurement` table + trigger | One table, one trigger, same cron |
| Large (> 100M) | Partitioned `fact_measurement` + consider TimescaleDB | Partition management cron |

---

## Freshness Summary

| Data | Strategy | Freshness |
|------|----------|-----------|
| Measurements (time series) | Phase 1: real-time (view on live data) / Phase 2: real-time (trigger) | Immediate |
| Dimension metadata (sensor, point, cave) | Small mat views or direct tables | Refresh every 5 min |
| Observation summaries | `mv_observation_summary` | Refresh hourly |
| Contamination geo | `mv_contamination_geo` | Refresh hourly |
