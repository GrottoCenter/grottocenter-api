# BI Tool Comparison for Scientific Data

## Fit with Your Scientific Data Model

| Aspect | Superset | Grafana | Metabase |
|--------|----------|---------|----------|
| Time series from `t_measurement` | ✅ Time-grain aggregation, line/area charts | ✅ Purpose-built for this — best time series rendering, annotations, zoom | ✅ Good line charts with time bucketing |
| Geo visualization of `t_point` | ✅ Best — deck.gl scatter, heatmap, polygon overlays for massifs | ⚠️ Basic Geomap panel (markers only, no polygons) | ✅ Good — pin maps, heatmaps; no polygon overlays |
| Contamination / human activity (categorical) | ✅ Pivot tables, bar charts, filters | ✅ Table panels, bar charts | ✅ Pivot, bar, pie — very intuitive |
| Cross-filtering (e.g., filter by cave → see all observations) | ✅ Native cross-filter on dashboards | ⚠️ Variables + links between dashboards (manual) | ✅ Native click-through filtering |
| Large measurement datasets (millions of rows) | ✅ Async queries via Celery, result caching | ✅ Handles well with proper indexing | ⚠️ Synchronous queries — can struggle with very large scans without materialized views |
| Sensor metadata display | ✅ Joins in SQL, display in table/tooltip | ✅ Same | ✅ Same, plus model-level relationships |

## Embedding Comparison

| Aspect | Superset | Grafana | Metabase |
|--------|----------|---------|----------|
| Embedding method | Embedded SDK (React component) or iframe | iframe (public dashboards or signed URLs) | iframe (signed embedding or public links) |
| Auth pass-through | ✅ Guest tokens via API — user sees only what you authorize | ✅ Auth proxy or anonymous access with org-level permissions | ✅ Signed embedding with locked parameters — very granular |
| White-labeling / chrome removal | ✅ Embedded SDK renders without Superset navigation | ✅ `&kiosk` mode strips Grafana chrome | ✅ Appearance settings hide Metabase branding (paid plan for full white-label, but OSS hides nav) |
| Seamless UX in your React front-end | ✅ Best — official `@superset-ui/embedded-sdk` React package, feels native | ⚠️ iframe only — no React SDK, always feels like an embed | ⚠️ iframe only — decent but still visibly an embed |
| Interactive filtering from host app | ✅ SDK supports passing filters programmatically | ⚠️ URL params only | ⚠️ URL params or locked filters in signed JWT |
| Self-service exploration inside embed | ✅ Can expose Explore mode in embed | ❌ Dashboards only — no ad-hoc query building in embed | ⚠️ Limited — can allow drill-through but not full question builder |
