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

`bot_admit_pages()` (`sql/9_29_2026_10_29_bot_admit_pages.sql`) is step 3 of the nightly pipeline, after the text scan: the content rule reads the verdicts, so a description written or edited yesterday counts tonight, not tomorrow. It inserts into `t_bot_admission` the records that qualify for the first time and returns the number admitted per type. It runs entrances first, so a cave qualifies the night its entrance does. Every record must be live (not deleted, not merged) and at least `min_age_days` old, judged on the later of its inscription and review dates.

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

`BotTextScanService.run()` is step 2 of the nightly pipeline, before admission. It runs the coordinate detector (`api/utils/coordinateDetector.js`) over every published free text, descriptions (title and body together) and names, and records one verdict per text in `t_bot_text_scan`. A text that holds a position is withheld from the pages until a moderator edits it; the page itself stays.

- **Incremental.** A text is scanned when it has no verdict, when its hash differs from the verdict's (it was edited), or when the verdict was made at another pattern set version. Raising `PATTERN_SET_VERSION` therefore scans everything again. The hash is computed by the database, with the expression the admission function uses.
- **No side effects.** It never writes to `t_description` or `t_name`, so their history, change-log and search triggers do not fire.
- **Fails closed.** If the detector throws on a text, that text is recorded as matched with the pattern `error` and the run goes on. Any other failure rejects the call, so the pipeline stops before publishing.
- **`t_bot_config.pattern_version`** moves to the current version only once every text has a verdict at that version. Until then the admission function and the view count no text, so a scan interrupted half way never lets an unscanned text through.
- **Texts edited during the scan.** The scan runs again over what was created or edited while it was going on, up to 3 passes. If texts are still pending after that, the call rejects and the version stays where it was.
- **Reporting.** The call returns, and logs, the number of distinct texts scanned and quarantined per source (a text read again in a later pass counts once, with its latest verdict), the number of detector errors and the number of passes.

## The page view

`v_bot_page` is the one source the pages, the sitemaps and the withdrawal worker read: anything absent from it is not published. It is defined by `sql/9_30_2026_10_29_v_bot_page.sql` (caves) and redefined, whole, by `sql/9_31_2026_10_30_v_bot_page_massifs_organizations.sql` (caves unchanged, plus massifs and organizations, `UNION ALL`). Columns: `entity_type` (`cave`, `massif` or `organization`), `entity_id`, `language` (of the main name), `lastmod` (see below) and `page`, a jsonb document holding exactly the fields of `api/utils/botSurfaceWhitelist.js`. A test compares the two, at every level.

Gates, all re-checked on every read:

- **Cave:** live, admitted, a main name that passed the scan, and at least one embedded entrance. A cave whose entrances are all sensitive has none, so it has no page.
- **Entrance:** live, not sensitive, admitted. A locked, non-sensitive entrance is shown. Its name is `null` when it has no main name that passed the scan.
- **Description** (cave, entrance, massif; organizations have none): not deleted, at least `min_age_days` old, and covered by a clean `t_bot_text_scan` row at the current `pattern_version` for the text as it is now; otherwise it is left out and the page stays. Texts repeated on many caves are shown: they only stop counting for the content rule.
- **Massif page:** live, admitted, not sensitive, a main name that passed the scan, and at least one listed cave. A massif with no published cave has no page (decision on #1759). `page` holds `id`, `name`, `language`, `lastmod`, `descriptions` and `caves`.
- **Caves of a massif page:** `{id, name, depth, length}` of the caves that have a page in the view (admitted, live, named, an embedded entrance) and hold an embedded entrance (live, not sensitive, admitted) inside the massif polygon, deepest first (unknown depth last), then by id. **The list is capped at 100 caves. The cap is a proposal, not a decided rule**: it keeps a page and the batch that reads it bounded for a massif with thousands of caves, and the `LIMIT` in the migration is the one place to change. The cave pages still link to every massif they belong to. The lookup starts from the entrances, so the partial GiST index on public entrances applies, and no coordinate reaches `page`.
- **Organization page:** live (not deleted, not merged), admitted, a main name that passed the scan. No sensitivity flag exists for organizations. `page` holds `id`, `name`, `language`, `city`, `county`, `region` (the `t_iso3166_2` name when the organization has a code, else the free text), `country`, `url` (only an `http(s)` address, else `null`: the field is free text; #1766 renders it with `rel="nofollow ugc"`), `yearBirth` and `lastmod`. Never address, postal code, mail, custom message, cavers, coordinates or type.
- **Massif listed on a cave:** admitted, not sensitive, named, and holding an embedded entrance of the cave.
- **Region:** the code of `t_iso3166_2` and its name; the geocoder's free text when the entrance has no code.
- **Names:** the main name of a record is the one with the lowest id. If it did not pass the scan, the cave has no page, an entrance has a `null` name, a massif is not listed on a cave, and a massif or an organization has no page; another main name is never substituted.

**`lastmod` is a sitemap hint, not a change detector.** It is the latest of the record's own dates, the moment each embedded item was admitted, the moment each description became old enough to show (its date plus `min_age_days`), and the dates of the names shown, so a description that passes the age gate tonight or an entrance admitted tonight moves it (on a massif page: a listed cave admitted tonight) even when their own dates are old. It does not see content that appears because its scan arrives late (a first scan, a quarantine cleared by a moderator, a rescan after a pattern version bump): the scan date is left out on purpose, since a version bump rescans every text and would move every page. Removals cannot be seen from a plain view: a description that is deleted, quarantined or made stale, an entrance that becomes sensitive, or a cave that leaves a massif page (deleted, or pushed out of the top 100), drops out of the page without moving `lastmod`, and it can even go back. Whatever decides which pages to regenerate or withdraw must compare a hash of `page` (for example `md5(page::text)`), never `lastmod`.

The view does not re-derive sensitivity from the massif polygons, for the reasons in [Sensitivity invariant](#sensitivity-invariant).

Read it by keyset, one type at a time: `WHERE entity_type = $1 AND entity_id > $2 ORDER BY entity_id LIMIT 1000`. `entity_id` alone is not unique (cave 42, massif 42 and organization 42 can all exist), and a constant `entity_type` is what lets the planner skip the other branches. It is a plain view, not a materialized one.

## Redirects

`v_bot_redirect (entity_type, entity_id, target_id)` (same migration) lists the merged records (`redirect_to` set) of type cave, massif and organization with the final target of their chain. #1766 uses it to produce redirect pages. A row exists only when:

1. the merged record has a `t_bot_admission` row: it was published, so crawlers may know its address; and
2. the final target has a row in `v_bot_page` of the same type: the redirect leads to a page that exists.

The view is meant for the nightly job, which reads it once: its final check reads `v_bot_page` for every merged record, so do not query it per request.

The chain follows `redirect_to` through merged records and stops at the first record that is not merged. It is cut after 10 redirects, so a cycle or a self-redirect never reaches a target and yields no row. A merge also soft-deletes the source, so `is_deleted` is not looked at on the source or on the records along the chain: deleted **and** merged redirects, deleted alone does not (the page is gone). A source with a redirect never has a page in `v_bot_page`, so the two views do not overlap. Entrances are not covered: they have no page of their own.

## The page generator

`BotPageGeneratorService.run({ adapter })` (`api/services/bot/BotPageGeneratorService.js`) is step 4 of the nightly pipeline. It publishes the pages of `v_bot_page` as static files and keeps `t_bot_page_manifest` equal to what is online. Scheduling is #1760; the page bodies are #1766; sitemaps are #1767.

**Render.** `BotRenderService.render(row)` turns one view row into one HTML string with the templates under `views/bot/`, each read and compiled once per process with `ejs.compile` (not `res.view`; the Sails view config and the email templates are untouched). The layout gives every page the doctype, `<html lang>` from the record (a BCP 47 tag: the ISO 639-1 code from `t_language.part1` when the language has one, `fra` becomes `fr`, else the ISO 639-3 code; a description in another language gets its own `lang` the same way), a title, the viewport, minimal inline CSS with no external asset, a header, a canonical link, `<meta name="generator" content="gc-static-pages">` (the audit recognises generated pages with it) and the licence footer: CC-BY-SA for texts, ODbL for data, in the wording of the SPA footer. `renderNotFound()` renders `404.html`, the only page with `noindex`. The generator, the withdrawal worker (#1886) and the audit (#1887) call the same function, each passing `languageTags` from `BotRenderService.loadLanguageTags()`: without it the 3-letter code is used, and the page renders different bytes.

> The bodies `views/bot/{cave,massif,organization}.ejs` are placeholders: a generic English rendering of the whitelisted fields. #1766 replaces them. An organization website is a link only if it is an `http(s)` address, with `rel="nofollow ugc"`. The render does not print `lastmod`, so a record whose only change is that hint renders the same bytes.

**Paths.** `api/utils/botPagePaths.js` (pure) maps a page to its blob key and its public URL, and back (`fromKey`, `fromUrl`):

| Type         | Blob key                 | Public URL                                      |
| ------------ | ------------------------ | ----------------------------------------------- |
| cave         | `caves/123.html`         | `https://grottocenter.org/ui/caves/123`         |
| massif       | `massifs/123.html`       | `https://grottocenter.org/ui/massifs/123`       |
| organization | `organizations/123.html` | `https://grottocenter.org/ui/organizations/123` |

There is no name slug. The base URL is `sails.config.custom.botSurface.publicBaseUrl`. The sitemaps (#1767) and the edge Worker (#1933) use the same module.

**Manifest.** `t_bot_page_manifest (path PRIMARY KEY, entity_type, entity_id, content_hash, lastmod, published_at)` (`sql/9_32_2026_11_02_bot_page_manifest.sql`, applied by hand in production): one row per published path. `content_hash` is the sha256 of the rendered HTML, the change detector; `lastmod` is the view's hint at the time of the upload. Static extras (`404.html`) have `entity_type = 'static'` and no `entity_id`.

**A run.** One at a time: `run()` takes a session-level advisory lock (key 1758) on a leased connection and rejects with code `E_BOT_PAGES_RUNNING` when another run holds it, before anything is read or published. Two overlapping runs could otherwise leave a page online with no manifest row, which no later run would delete. `concurrency` and `batchSize` must be positive integers; anything else is rejected up front.

1. For each type, one at a time, it reads the view by keyset (`entity_id > $cursor ORDER BY entity_id LIMIT 1000`), renders and hashes each row, and uploads only the pages whose hash differs from the manifest.
2. In step with the view it deletes the manifest paths of the same id range that the batch no longer holds (a record that left the view). The manifest is never loaded whole: one batch of rows and `concurrency` rendered pages (4) are in memory at a time.
3. It publishes the static extras, and deletes static paths it no longer produces.
4. The manifest is written **after** each successful upload or delete. A delete is `adapter.delete` then the manifest row removal, and deleting a path that is already gone is not an error. So a crash at any point leaves the manifest consistent with what is online, and at worst a page is uploaded again. When a call fails, nothing new is started and the calls in flight finish first, so the manifest also matches the adapter when the run rejects.

It returns `{ uploaded, unchanged, deleted, byType }`. A blob deleted by hand while its manifest row remains is not noticed (the hash still matches): the audit (#1887) compares the adapter with the manifest.

**Storage adapters** (`api/services/bot/storage/`): one interface, `put(key, html)`, `delete(key)`, `list()`.

- `LocalStorageAdapter`: a directory, for dev and tests. Writes through a temporary file (`*.part`) and a rename, and refuses a key outside the root. `list()` skips the temporary files a killed process can leave behind.
- `AzureBlobStorageAdapter`: the `$web` container of an Azure Blob static website, through `@azure/storage-blob` (as `FileService`). It uploads with `Content-Type: text/html; charset=utf-8`. The edge Worker forwards the blob's ETag and Last-Modified; the Worker never caches these pages, so no CDN purge is needed.

**Configuration** (`sails.config.custom.botSurface`, from the environment; nothing is hardcoded):

| Variable                            | Meaning                                                            | Default                       |
| ----------------------------------- | ------------------------------------------------------------------ | ----------------------------- |
| `BOT_PAGES_PUBLIC_BASE_URL`         | The SPA's own address; pages live at `<base>/caves/123`            | `https://grottocenter.org/ui` |
| `BOT_PAGES_STORAGE`                 | `local` or `azure`                                                 | `local`                       |
| `BOT_PAGES_LOCAL_DIR`               | Directory for the `local` driver (gitignored default)              | `.local-bot-pages`            |
| `BOT_PAGES_AZURE_CONNECTION_STRING` | Connection string of the storage account (`azure`; required)       | none                          |
| `BOT_PAGES_AZURE_CONTAINER`         | Container name, the static website one, `$web` (`azure`; required) | none                          |

`createStorageAdapter(sails.config.custom.botSurface.storage)` builds the adapter and throws when the driver is unknown or an Azure setting is missing.

**Memory.** `BotPageGeneratorService.test.js` runs the generator over 10,000 synthetic caves of about 6 KB of description each and asserts that the live heap it retains (after a forced GC at each batch) stays under a fixed ceiling of 32 MB; the measurement is recorded in the PR.
