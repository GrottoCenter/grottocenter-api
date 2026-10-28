# Bot surface

Notes on the pages published for indexing bots (tracking issue: #1889).

## Sensitivity invariant

`v_bot_page` filters entrances on their own `is_sensitive` flag. It does not re-derive sensitivity from massif polygons: a spatial join would be expensive on the production instance, and it would hide the defect. A wrong flag also leaks through the SPA, the search index and `GET /api/v1/entrances/:id`, so it is fixed at the source.

That is safe only while the massif-to-entrance propagation has been fully applied (`MassifService.propagateSensitivityToEntrances`, called by `setSensitivity`, and `MassifService.isPointInSensitiveMassif` for new entrances). Both skip locked entrances.

The two ordinary update paths that could break it now keep it: `PUT /api/v1/entrances/:id` marks an entrance moved into a sensitive massif as sensitive, and `PUT /api/v1/massifs/:id` propagates when it changes the polygon of a sensitive massif (a polygon resent unchanged is ignored). A locked entrance stays exempt, and an administrator who unmarks an entrance that sits in a sensitive massif without locking it still creates a violation, which the check reports.

`bot_cascade_check()` (`sql/9_27_2026_10_26_bot_cascade_check.sql`) asserts it and returns one row:

| Column                             | Meaning                                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `violation_count`, `violation_ids` | Live, non-sensitive, **unlocked** entrances inside a live sensitive massif. A failure; ids capped at 100, count exact. |
| `override_count`, `override_ids`   | Same, but **locked**: a moderator's override, honoured by the bot pages. Reported, never a failure.                    |

The nightly pipeline runs it first and stops before publishing when `violation_count > 0`.

A violation is fixed by finding why the flag is wrong (a bulk write that moved coordinates, an import that bypassed `EntranceService.createEntrance`), not by patching the check.

## Tables

`sql/9_28_2026_10_28_bot_foundation.sql` creates the tables the bot pages decide with. They hold decisions, not content.

| Table             | Holds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `t_bot_admission` | `(entity_type, entity_id, bot_admitted_at)`. A row is inserted the first time a record qualifies and is never updated or deleted, so a page does not leave and re-enter search results when someone edits it. Sticky against edits only: a record that is later deleted, merged or put in a sensitive massif still leaves the surface, because `v_bot_page` re-checks those gates on every read. Admission is necessary, not sufficient.                                                   |
| `t_bot_config`    | One row of thresholds: `min_age_days` (30) and, for the cave content rule, `min_text_chars` (500), `min_depth_m` (300), `min_length_m` (3000), `max_boilerplate_caves` (3). `pattern_version` is the coordinate detector's current version, set by the scan step once every text has been scanned at it (0 means no complete scan, so no text counts). Changing stage is an `UPDATE`, not a migration.                                                                                     |
| `t_bot_text_scan` | The coordinate detector's verdict per published free text: `t_description` (title and body, which also carries document titles) and `t_name`. It holds hash, pattern version, match, family and excerpt; the excerpt is for moderators and never published. `t_location`, `t_comment`, `t_history` and `t_rigging` are never rendered on the bot pages, so they are not scanned. A change that starts publishing one of them must first widen the `source_table` check in a new migration. |

Production does not run migrations on deploy: apply the file by hand. It is idempotent and never resets `t_bot_config`.

## Admission

`bot_admit_pages()` (`sql/9_29_2026_10_29_bot_admit_pages.sql`) is step 2 of the nightly pipeline. It inserts into `t_bot_admission` the records that qualify for the first time and returns the number admitted per type. It runs entrances first, so a cave qualifies the night its entrance does. Every record must be live (not deleted, not merged) and at least `min_age_days` old, judged on the later of its inscription and review dates.

| Type         | Also required                                                                          |
| ------------ | -------------------------------------------------------------------------------------- |
| entrance     | Not sensitive. A locked, non-sensitive entrance qualifies.                             |
| cave         | An admitted public entrance, and the content rule below.                               |
| massif       | Not sensitive, and an admitted public entrance of an admitted cave inside its polygon. |
| organization | Nothing more.                                                                          |
| document     | Not admitted: documents stay disabled until their phase.                               |

**Content rule for caves (stage 1).** Unique description text of at least 500 characters, or depth of at least 300 m, or length of at least 3,000 m. A depth or length of 0 means unknown and never counts.

- Unique text is the body of the descriptions of the cave and of its admitted public entrances, counted once per distinct body.
- A description counts only when it is not deleted, is at least 30 days old, and has a `t_bot_text_scan` row that is clean, made at `t_bot_config.pattern_version`, and matching the text as it is now. A missing, outdated or stale scan means the text counts for nothing.
- A body found on more than 3 caves is boilerplate and is ignored.
- The thresholds are in `t_bot_config`.

Admission is sticky, so a later edit that shrinks a text, or a record deleted afterwards, does not remove the row; `v_bot_page` re-checks deletion, merges and sensitivity.

## Text scan

`BotTextScanService.run()` is step 3 of the nightly pipeline. It runs the coordinate detector (`api/utils/coordinateDetector.js`) over every published free text, descriptions (title and body together) and names, and records one verdict per text in `t_bot_text_scan`. A text that holds a position is withheld from the pages until a moderator edits it; the page itself stays.

- **Incremental.** A text is scanned when it has no verdict, when its hash differs from the verdict's (it was edited), or when the verdict was made at another pattern set version. Raising `PATTERN_SET_VERSION` therefore scans everything again. The hash is computed by the database, with the expression the admission function uses.
- **No side effects.** It never writes to `t_description` or `t_name`, so their history, change-log and search triggers do not fire.
- **Fails closed.** If the detector throws on a text, that text is recorded as matched with the pattern `error` and the run goes on. Any other failure rejects the call, so the pipeline stops before publishing.
- **`t_bot_config.pattern_version`** moves to the current version only once every text has a verdict at that version. Until then the admission function and the view count no text, so a scan interrupted half way never lets an unscanned text through.
- **Reporting.** The call returns, and logs, the number of texts scanned and quarantined per source, and the number of detector errors.
