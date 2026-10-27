# Bot surface

Notes on the pages published for indexing bots (tracking issue: #1889).

## Sensitivity invariant

`v_bot_page` filters entrances on their own `is_sensitive` flag. It does not re-derive sensitivity from massif polygons: a spatial join would be expensive on the production instance, and it would hide the defect. A wrong flag also leaks through the SPA, the search index and `GET /api/v1/entrances/:id`, so it is fixed at the source.

That is safe only while the massif-to-entrance propagation has been fully applied (`MassifService.propagateSensitivityToEntrances`, called by `setSensitivity`, and `MassifService.isPointInSensitiveMassif` for new entrances). Both skip locked entrances.

Two ordinary API paths bypass both and can break the invariant (tracked in #1944): `PUT /api/v1/entrances/:id` moving an entrance into a sensitive massif, and `PUT /api/v1/massifs/:id` enlarging the polygon of an already-sensitive massif. Until #1944 is fixed, either one makes the nightly pipeline stop.

`bot_cascade_check()` (`sql/9_27_2026_10_26_bot_cascade_check.sql`) asserts it and returns one row:

| Column                             | Meaning                                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `violation_count`, `violation_ids` | Live, non-sensitive, **unlocked** entrances inside a live sensitive massif. A failure; ids capped at 100, count exact. |
| `override_count`, `override_ids`   | Same, but **locked**: a moderator's override, honoured by the bot pages. Reported, never a failure.                    |

The nightly pipeline runs it first and stops before publishing when `violation_count > 0`.

A violation is fixed by finding why the flag is wrong (a bulk write that moved coordinates, an import that bypassed `EntranceService.createEntrance`, an entrance moved or a sensitive polygon enlarged through the update endpoints above), not by patching the check.
