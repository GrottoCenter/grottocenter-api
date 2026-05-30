# Additional Design Considerations for Superset Integration

## 1. Row-Level Security for Superset

The API has RBAC (5 roles). When embedding Superset dashboards, decide: does everyone see all scientific data, or are some observations restricted (e.g., sensitive cave locations, unpublished research)?

If some data is restricted, two options:

- **Superset Row-Level Security (RLS)**: Define rules like "users without Moderator role can't see observations where `data_quality = 'raw'`". Superset appends a WHERE clause automatically.
- **Filtered views per role**: Create `v_measurement_wide_public` (excludes sensitive data) and `v_measurement_wide_full`, register different datasets per user group.

Decide this now because it affects which columns to expose in the analytics layer (e.g., do you need an `is_public` flag on `t_observation`?).

---

## 2. Time Zone Handling

`t_measurement.timestamp` — is it always UTC, or does it depend on the data logger's local time? Cavers deploy loggers in caves across many time zones. If timestamps arrive in local time without zone info, you'll get incorrect time series overlays when comparing sensors in different countries.

Suggestion: enforce `TIMESTAMPTZ` (already planned) and require all ingested data to be converted to UTC at import time. Store the original timezone offset on `t_time_series` if you need to display local time in dashboards:

```
t_time_series + timezone_offset VARCHAR  (e.g., '+02:00', 'Europe/Paris')
```

Superset can then apply a timezone conversion for display without corrupting the stored data.

---

## 3. Data Ingestion API Design

An endpoint (or batch import flow) is needed for uploading measurement data. Think about:

- **Single-measurement POST** (real-time sensors via IoT gateway)
- **Bulk CSV/JSON upload** (data logger dumps — thousands to millions of rows)
- **Streaming append** (ongoing telemetry)

The bulk path is the one that interacts with the trigger-disable pattern in the star schema doc. Design the API so the service layer knows when it's in "bulk mode" and can wrap the import in the disable/enable/batch-insert sequence.

---

## 4. Aggregation Strategy for Long Time Series

A data logger running every 5 minutes for 2 years produces ~210k rows per sensor. Superset will struggle to render 210k points on a line chart — browsers can't draw that many SVG/canvas elements usefully.

Two approaches:

- **Pre-aggregated rollups**: Store hourly/daily averages in a separate table (`fact_measurement_hourly`). Superset picks the right granularity based on the time range selected.
- **Let Superset aggregate**: Superset's time-grain control (`GROUP BY DATE_TRUNC('hour', timestamp)`) handles this at query time. Works fine with partition pruning up to ~10M rows.

For Phase 1, let Superset aggregate at query time. For Phase 2, consider adding rollup tables if dashboard load times degrade.

---

## 5. Observation-Level Attachments (Photos, PDFs)

The ERD links observations to documents (`t_observation ||--o{ t_document`). If researchers attach field photos or lab reports, Superset can't display binary files — but it can display links. Consider adding a `document_url` or `thumbnail_url` to `mv_observation_summary` so dashboards can show clickable links to supporting evidence.

---

## 6. Audit Trail for Data Quality Transitions

When `data_quality` changes from `raw` → `validated` or `raw` → `rejected`, that's a significant event for researchers. Consider logging these transitions:

```sql
CREATE TABLE t_time_series_quality_log (
  id SERIAL PRIMARY KEY,
  id_time_series INT NOT NULL,
  old_quality VARCHAR,
  new_quality VARCHAR NOT NULL,
  changed_by INT NOT NULL,  -- references t_caver
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

This lets you build a Superset dashboard showing "validation progress" — how much data has been reviewed, by whom, and when. Useful for project managers overseeing multi-site monitoring campaigns.

---

## 7. Units Conversion Layer

The model stores raw values in the sensor's native unit. But researchers may want to compare temperature from a Celsius sensor and a Fahrenheit sensor on the same chart. Options:

- **Normalize at ingestion** (convert everything to SI units) — simplest for Superset, but loses original precision context.
- **Convert at query time** (Superset calculated column) — flexible but requires defining conversion formulas per unit pair.
- **Store both** (add `value_si` column on `t_measurement`) — best of both worlds, slight storage cost.

If you go with "store both", the fact table carries `value` (original) and `value_si` (normalized), and Superset defaults to `value_si` for cross-sensor comparisons.

---

## Priority

| Suggestion | When to Decide | Impact if Deferred |
|------------|---------------|-------------------|
| Row-level security | Before Superset deployment | Hard to retrofit — affects dataset design |
| Time zone handling | Before first data ingestion | Corrupted data if mixed — painful to fix |
| Ingestion API design | Before first data ingestion | Affects bulk import performance |
| Aggregation rollups | Phase 2 | Dashboard slowness, not data loss |
| Document URLs in views | Anytime | Nice-to-have |
| Quality audit trail | Before `data_quality` is used in production | Missing history if added later |
| Units conversion | Before first multi-unit dataset | Comparison charts won't work without it |

Items 1–3 are "decide now" territory. The rest can wait.
