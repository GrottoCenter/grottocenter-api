# Entrance Snapshot Types

The `GET /api/v1/entrances/:id/snapshots` endpoint returns a chronologically sorted timeline of entrance history entries. Each snapshot object may include type flags that help the front-end decide how to render them.

## Snapshot Type Flags

| Flag | Type | Meaning |
|------|------|---------|
| _(none)_ | Regular snapshot | A user-initiated edit (coordinates, booleans, cave move, etc.) |
| `isNameChangeSnapshot: true` | Name change | A synthetic snapshot representing a rename event |
| `isEnrichmentSnapshot: true` | Enrichment | A system-generated snapshot from the async geocoding job |

## `isEnrichmentSnapshot`

### What triggers it

When an entrance is created or its coordinates are moved, an asynchronous geocoding job (Nominatim reverse geocode) runs to populate `region`, `county`, `city`, and `iso3166` (ISO 3166-2 subdivision code). This causes an UPDATE on the entrance, which fires the history trigger and creates an h_entrance row.

### How it's detected

The enrichment job wraps its UPDATE in a transaction with `SET LOCAL app.is_enrichment = 'true'`. The `histo_update_entrance` trigger reads this session variable and sets `is_enrichment = true` on the resulting h_entrance row. This is deterministic — no heuristics or column diffing involved.

### When it appears

- **After entrance creation**: The entrance is created, then a few seconds later the enrichment job populates region/county/city. The snapshot captures the state before enrichment (region/city = null).
- **After a coordinate move**: The user's update clears region/county/city to null (stale data). Then enrichment repopulates them for the new coordinates.

### Recommended UI treatment

- **Collapse or hide by default** with a "Show system updates" toggle
- Or **grey out / de-emphasize** with a label like "Geocoding update" or "System"
- The snapshot data is technically correct (it's real history) — just not a user action

### Example response

```json
{
  "entrances": [
    {
      "id": "2026-07-10T19:58:11.728Z",
      "t_id": 36775,
      "region": null,
      "city": null,
      "hasBat": true,
      "reviewer": null,
      "names": [],
      "caveName": "Network Alpha",
      "isEnrichmentSnapshot": true
    },
    {
      "id": "2026-07-10T19:58:13.596Z",
      "t_id": 36775,
      "region": "Auvergne-Rhône-Alpes",
      "city": "Grand-Aigueblanche",
      "hasBat": true,
      "reviewer": { "id": 2, "nickname": "MelvildMode" },
      "names": [],
      "caveName": "Network Alpha"
    }
  ]
}
```

## `isNameChangeSnapshot`

### What triggers it

When an entrance is renamed, the trigger on `t_name` creates an `h_name` row. The API injects a synthetic snapshot into the timeline to represent this event, so the front-end can show "name changed from X to Y" in the history.

### Shape

Name-change snapshots have a reduced set of fields (no coordinates, no booleans — only name-related data and temporal cave name resolution). They always have:

- `isNameChangeSnapshot: true`
- `name`: the **old** name being superseded
- `language`: the language of the old name
- `caveName`: temporally resolved cave name at that point
- `latitude`, `longitude`, `altitude`: `null`
- `cave`: `null`

### Recommended UI treatment

- Render as a distinct "Rename" event in the timeline
- Show the old name in the snapshot and let the user infer the new name from the next entry (or from the current name if it's the last rename)

## Regular snapshots

All other snapshots represent user-initiated edits. They have:

- `reviewer`: the user who made the edit (object with `id` and `nickname`)
- Full entrance data reflecting the state **before** the edit (OLD values from the trigger)
- `names: []` (always empty — current TName records are never leaked into historical snapshots)
- `name`: temporally resolved entrance name at that point in time
- `language`: temporally resolved language at that point in time
- `caveName`: temporally resolved cave name at that point in time
