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

**The redirect page** (`BotRenderService.renderRedirect`, `views/bot/redirect.ejs`) is published by the generator at the old record's path (`caves/<oldId>.html`) when `v_bot_redirect` has a row for it: a small English page with `<meta http-equiv="refresh" content="0; url=<target>">`, a `<link rel="canonical">` to the final target, `noindex` and a link to the target, and **no `og:*` tag** (a page that is not indexed has nothing to preview). The target address is also put in the blob metadata `redirectto`, so the edge Worker (#1933) can answer crawlers with a real `301` if the metadata reaches it (to verify there); without it, an immediate meta refresh reads as a redirect to search engines too. A redirect is a manifest row like a page, written after its upload and deleted, with its metadata, when the redirect stops being produced (the target left the view, the record was restored). Chains are already resolved by the view, so a two-step merge points at the final target; an intermediate record that was published has its own redirect to that same target.

## The page generator

`BotPageGeneratorService.run({ adapter })` (`api/services/bot/BotPageGeneratorService.js`) is step 4 of the nightly pipeline. It publishes the pages of `v_bot_page` as static files and keeps `t_bot_page_manifest` equal to what is online. Scheduling is #1760; what a page contains is described in [The pages](#the-pages); sitemaps are #1767.

**Render.** `BotRenderService.render(row, { languageTags, countryNames, hubLinks })` turns one view row into one HTML string. It is built in two steps: `api/utils/botPageModel.js` projects the row's `page` through the whitelist and computes everything the page shows (language and its writing direction, labels, country names, title, description, breadcrumb), and the templates under `views/bot/` and the JSON-LD (`api/utils/botJsonLd.js`) read that model and nothing else. Each template is read and compiled once per process with `ejs.compile` (not `res.view`; the Sails view config and the email templates are untouched). The generator, the withdrawal worker (#1886) and the audit (#1887) call the same function, each passing `languageTags` from `BotRenderService.loadLanguageTags()`, `countryNames` from `BotRenderService.loadCountryNames()` and `hubLinks` (`{ index, country, region }`, from `BotHubService.createHubLinks`; `BotRenderService.NO_HUB_LINKS` when there are no hubs), and, for a massif row, `massifExtras` (see [Hub pages](#hub-pages)). These options are required: `render` throws a `TypeError` without them (an empty `Map` is the explicit way to keep every 3-letter code, to show country codes and to show a massif without extras), because a page rendered without them has other bytes than the generator's. The hubs have their own entry point, `BotRenderService.renderHub(row, { languageTags, countryNames, hubLinks, hubFigures })`. The output does not include `lastmod`, so a record whose only change is that hint renders the same bytes.

`renderNotFound()` renders `404.html`, the only content-less page, with `noindex`. `renderRedirect(entityType, targetId)` renders a redirect page (see [Redirects](#redirects)).

**Paths.** `api/utils/botPagePaths.js` (pure) maps a page to its blob key and its public URL, and back (`fromKey`, `fromUrl`):

| Type         | Blob key                 | Public URL                                      |
| ------------ | ------------------------ | ----------------------------------------------- |
| cave         | `caves/123.html`         | `https://grottocenter.org/ui/caves/123`         |
| massif       | `massifs/123.html`       | `https://grottocenter.org/ui/massifs/123`       |
| organization | `organizations/123.html` | `https://grottocenter.org/ui/organizations/123` |

The hubs (#1935) are keyed by a string, not an id (`toHubKey`, `toHubUrl`, and `fromKey`/`fromUrl`, which answer `{ entityType: 'hub', hubType, hubKey }` for them):

| Hub             | Hub key                                  | Blob key                       | Public URL                                            |
| --------------- | ---------------------------------------- | ------------------------------ | ----------------------------------------------------- |
| countries index | `ALL`                                    | `countries.html`               | `https://grottocenter.org/ui/countries`               |
| country         | ISO 3166-1 alpha-2, `FR`                 | `countries/FR.html`            | `https://grottocenter.org/ui/countries/FR`            |
| region          | code of `t_iso3166_2`, `FR-01`, `GB-CMN` | `countries/FR/regions/01.html` | `https://grottocenter.org/ui/countries/FR/regions/01` |

There is no name slug. The base URL is `sails.config.custom.botSurface.publicBaseUrl`. The sitemaps (#1767) and the edge Worker (#1933) use the same module.

**Manifest.** `t_bot_page_manifest (path PRIMARY KEY, entity_type, entity_id, hub_type, hub_key, content_hash, lastmod, redirect_to, published_at)` (`sql/9_32_2026_11_02_bot_page_manifest.sql`, then `sql/9_33_2026_11_03_bot_page_manifest_redirect.sql` for `redirect_to` and `sql/9_34_2026_11_04_v_bot_hub.sql` for the hubs, all applied by hand in production): one row per published path. `content_hash` is the sha256 of the rendered HTML, the change detector; `lastmod` is the view's hint at the time of the upload for a cave or an organization, and **the time of the upload for a hub or a massif page**: those change with the SPA figures and with their list of caves, which the view's hint does not see, so their `lastmod` moves when the page does and never goes back. Static extras (`404.html`) have `entity_type = 'static'` and no `entity_id`. **A hub has `entity_type = 'hub'`, no `entity_id`, and a `hub_type` (`index`, `country` or `region`) and a `hub_key` (`ALL`, `FR`, `FR-01`)**: the sitemaps (#1767) read the hub type from the column and the address from `botPagePaths.toHubUrl(hub_type, hub_key)`. A CHECK constraint ties the columns together (a hub has both, no id and no `redirect_to`; nothing else has either). **`redirect_to` tells a redirect page from a content page**: it is the id of the final target (same `entity_type`) on the row of a redirect page, and NULL on a content page and on the static extras. The sitemaps (#1767) list only the rows where it is NULL (a redirect page is `noindex`), and the withdrawal worker (#1886) and the audit (#1887) re-render only those rows from `v_bot_page`: a redirect row has no `v_bot_page` row and is checked against `v_bot_redirect`.

**A run.** One at a time: `run()` takes a session-level advisory lock (key 1758) on a leased connection and rejects with code `E_BOT_PAGES_RUNNING` when another run holds it, before anything is read or published. Two overlapping runs could otherwise leave a page online with no manifest row, which no later run would delete. `concurrency` and `batchSize` must be positive integers; anything else is rejected up front.

0. **Before anything else it reads the published hubs, once** (`BotHubService.loadHubs`, `v_bot_hub` by keyset, one hub type at a time). Those rows give the `hubLinks` of every page of the run and are the hubs the run publishes in step 4, so the links and the hubs cannot disagree inside a run: a hub that is withdrawn while the run goes on is published a day late, never linked and missing. The hubs are at most about 870 rows of at most 100 caves each, a few MB held for the run. A cave page changes only when a hub it links to appears or leaves, and depends on the set of hubs, not on the order they were read in.
1. For each type, one at a time, it reads `v_bot_redirect` once for that type (the merged records: a few thousand rows of two integers), then the view by keyset (`entity_id > $cursor ORDER BY entity_id LIMIT 1000`), renders and hashes each row, and uploads only the pages whose hash differs from the manifest.
2. For the same id range it publishes the redirect pages (see [Redirects](#redirects)): a page at the old record's path, as a manifest row of the old record's type and id. An id that is both in the view and in `v_bot_redirect` (the two are read apart) is published as the page.
3. In step with the view it deletes the manifest paths of the same id range that neither the batch nor the redirects hold (a record that left the view, or a redirect that is no longer produced). The manifest is never loaded whole: one batch of rows and `concurrency` rendered pages (4) are in memory at a time.
4. It publishes the hubs from the rows read in step 0, with the SPA's figures (see [Hub pages](#hub-pages)), and deletes the manifest hub paths it does not produce (a hub that stopped being published: the file, then the row). The hubs are few, so those rows are selected in one query, not walked by range.
5. It publishes the static extras, and deletes static paths it no longer produces.
6. The manifest is written **after** each successful upload or delete. A delete is `adapter.delete` then the manifest row removal, and deleting a path that is already gone is not an error. So a crash at any point leaves the manifest consistent with what is online, and at worst a page is uploaded again. When a call fails, nothing new is started and the calls in flight finish first, so the manifest also matches the adapter when the run rejects.

It returns `{ uploaded, unchanged, deleted, byType }`. A blob deleted by hand while its manifest row remains is not noticed (the hash still matches): the audit (#1887) compares the adapter with the manifest.

**Storage adapters** (`api/services/bot/storage/`): one interface, `put(key, html, { metadata })`, `delete(key)`, `list()`. `metadata` is an optional flat object of strings (`redirectto` on a redirect page) and replaces the page's previous metadata: a page put without any has none.

- `LocalStorageAdapter`: a directory, for dev and tests. The metadata of `caves/1.html` is kept in the sidecar `caves/1.html.metadata.json`, which `list()` does not report and `delete()` removes. Writes through a temporary file (`*.part`) and a rename, and refuses a key outside the root. `list()` skips the temporary files a killed process can leave behind.
- `AzureBlobStorageAdapter`: the `$web` container of an Azure Blob static website, through `@azure/storage-blob` (as `FileService`). It uploads with `Content-Type: text/html; charset=utf-8` and the metadata as the blob's metadata (a Put Blob replaces the blob's metadata as a whole, so a page uploaded without any drops the `redirectto` it had; verified against a stubbed container only). The edge Worker forwards the blob's ETag and Last-Modified; the Worker never caches these pages, so no CDN purge is needed.

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

## The pages

What #1766 puts on a page. All of it comes from the whitelisted fields of `v_bot_page`; nothing is read from the database at render time except the language tags and the country names, once per run.

**Every page.** The layout (`views/bot/layout.ejs`) gives the doctype, `<html lang>`, a `<title>`, `<meta name="description">`, exactly one self-referencing `<link rel="canonical">` (`https://grottocenter.org/ui/<plural>/<id>`), the OG tags (not on the redirect page; `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url` = the canonical, `og:image` = the site default `/og-image.png` at the origin of the base URL), one JSON-LD block, minimal inline CSS and no external asset, a header, `<meta name="generator" content="gc-static-pages">` and the licence footer (CC-BY-SA for texts, ODbL for data). There is no `noindex` on a content page and no `hreflang`. The footer wording stays English on every page: it is the SPA footer's wording, and its links sit inside the sentences.

**Title.** `<name> - Grottocenter`. A title over 60 characters is cut in the name part (counted in code points, never in half a surrogate pair), which then ends with `…`, and the brand suffix is kept.

**Description.** Built from whitelisted fields and the page's labels, 160 characters at most: the type, the name, depth and length for a cave, the caves listed for a massif, the place and the year of foundation for an organization.

**Cave.** The name; depth, length (a value of 0 means unknown and is left out), temperature, diving; links to its massifs; its descriptions; then one block per public entrance with its name (the label "Entrance" when it has none), municipality, county, region, country, discovery year, the danger and rule flags, and its own descriptions. Geology is not published. Sensitive entrances never appear, not even in a count: the page shows the entrances of the row. As a second line behind the view, an entrance that carries `isSensitive: true` is dropped before the whitelist projection (the view never produces one).

**Massif.** The name, the SPA's figures for the massif and the regions it is in, its descriptions, and its caves (as listed by the view, at most 100) linked by their SPA address, with depth and length when known. The last two additions come from the hubs, see below.

**Organization.** The name, municipality, county, region, country, the year of foundation, and the website as a link only when it is an `http(s)` address, with `rel="nofollow ugc"`.

**Breadcrumb.** `country › region › cave`, on caves whose entrance has a region code. A crumb is a link exactly when its hub is published: `hubLinks.country(iso)` and `hubLinks.region(iso, regionCode)` return the SPA address of the hub or `null`, and the generator builds them from the hubs it read at the start of the run (a region links only with the country its code starts with). Everything that renders a page must pass the same `hubLinks`, or its bytes differ from the generator's. The region is shown as the hub names it (see [Hub pages](#hub-pages)).

**JSON-LD.** One `<script type="application/ld+json">` block, built from the same model as the HTML. `@context` and `@type` come from the mapping models the API already answers with (`api/services/mapping/models/{Cave,Massif,Organization,Entrance}Model.js`). It never carries `geo`, `GeoCoordinates`, a coordinate or a person, because the builders name the keys they emit and never copy an object. `<` is escaped as `\u003c` by `serializeForScript` (a pure function with a property test), so no value can close the element or open a comment.

**Languages** (decided on #1766). One page per record, in the language of its own content: `v_bot_page.language` (the language of the main name). When a row has none, the renderer takes the language of the first description (the record's, then its entrances'), then English. `<html lang>` is the BCP 47 tag (see above).

- _Labels_ are the front's UI translations. `api/utils/botLabels/keys.js` maps each label id the templates use (30) to the key of the front's `public/lang/<lang>.json`; `node scripts/generate-bot-labels.js [langDir]` regenerates `api/utils/botLabels/<lang>.json` for the 15 front languages (`--check` fails when the committed files differ from the front), and both the script and the generated files are committed, so neither the app nor the tests need the front repository. A key the front lacks for a language falls back to its English text. A page in a language without a UI translation (Polish, Hindi...) uses the English labels. The completeness test checks, for each of the 15 languages, that its file holds exactly the ids of `keys.js`, that none is empty, and that every id used by the templates and the page model is listed (and every listed id used); the front's own key list is the snapshot in `keys.js`, to be refreshed with the script when the front changes a text.
- _Country names_ are `t_country.native_name`, whatever the language of the page (a Portuguese cave in Spain shows `España`): it is the one name column kept, the translated ones are retired by #1939. An unknown code is shown as is. The region is the `name` column of `t_iso3166_2` (see the view), never its translated columns (#1937). This replaces the "name in the language of the page" of the first version of #1766.
- _Direction_: a page whose language is written right to left (`ar`, `he`, `fa`, `ur`, `yi`) gets `dir="rtl"` on `<html>`, and a description in its own language gets `dir="auto"`.
- _City, county, region_ are shown as stored.
- _Descriptions_ are each in a `<section lang>`, those in the page language (and those without a language) first.
- _Names_ are shown as stored, in catalogue form. **Alternative names are not published**: the whitelist carries only the main name, so a bracketed list of alternative names (decision on #1766) needs `names` added to the whitelist and the view first, and is not done here.

## Hub pages

Hub pages (#1935) give every cave a crawlable parent at the SPA's own addresses: the countries index `/ui/countries`, a country `/ui/countries/FR`, a region `/ui/countries/FR/regions/01`. The massif page already is the massif hub (`/ui/massifs/<id>`, #1759).

**Which hubs exist.** `v_bot_hub` (`sql/9_34_2026_11_04_v_bot_hub.sql`) is built from the rows of `v_bot_page` (the published caves) and nothing else: a hub exists only with at least one published cave, so a region whose caves are all sensitive or unpublished has no hub and no page links to it. A cave is on the hub of every country and region where it has a published entrance. The country must be in `t_country` with a native name; the region must be in `t_iso3166_2` with a name that is not empty once cleaned. The index exists when at least one country hub does. Columns: `hub_type` (`index`, `country`, `region`), `hub_key`, `language`, `lastmod` (the latest of its caves; not what the manifest records, see above), `page` (exactly the whitelist's `hubIndex`, `hubCountry` or `hubRegion` fields, compared by a test). It is a plain view, **read whole, once per run** (`BotHubService.loadHubs`): its `MATERIALIZED` CTEs build every published cave of `v_bot_page` before any filter on `hub_type` can prune, so a read per type would pay that three times, and the result (about 870 rows) is held in memory anyway. The production cost has not been measured (no data in the bot tables yet).

**Why a view of its own.** Hub keys are strings (`FR`, `FR-01`) while `v_bot_page.entity_id` and `t_bot_page_manifest.entity_id` are integers and the manifest CHECK allowed only cave, massif, organization and static. Widening `entity_id` to text would have touched every keyset read of the three record types. So the hubs are a fourth thing next to them: their own view keyed by `(hub_type, hub_key)`, and a manifest `entity_type = 'hub'` with `hub_type` and `hub_key` columns and no `entity_id` (like `static`). The keyset reads, the manifest-after-upload rule and the deletion walk are unchanged for the records; the hubs are published and deleted as a set (see the generator, step 4).

**Content.** No user-written text: names, figures and links.

| Hub             | Shows                                                                               | Links to                                         |
| --------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| countries index | every country with a published cave: name, number of caves                          | country hubs                                     |
| country         | name, figures, its regions with their number of caves, its massifs, up to 100 caves | region hubs, massif pages, cave pages            |
| region          | name, figures, its massifs, up to 100 caves                                         | the index and the country, massif and cave pages |
| massif          | (the massif page) plus the figures of the massif and the regions its caves are in   | region hubs                                      |

- **Figures** are worded as the SPA's statistics widget words them: the number, then the front's string for it (`8 cavités permettent de faire de la plongée`, `456789 m Développement cumulé`), with the ICU plural form the front uses when it has one (`pluralText`). The heading of a list of caves is the front's lowercase `caves` ("cavités"), capitalized: the front's `Caves` reads "Réseaux" in French, like `Networks`.
- **Figures** (number of caves, networks, massifs, diving caves, total length, average depth and length) are **the SPA's own statistics**: `BotHubService` calls `StatisticsCountryService`, `StatisticsRegionService` and `StatisticsMassifService` (which read `v_country_info`, `v_region_info` and `v_massif_info`, refreshed by `pg_cron`) and converts the results as the statistics controllers do. They may include records that are not published, and a test compares them with the `/statistics` endpoints on the same fixture. There is no "deepest" or "longest" cave and no ranking. When the statistics count no cave for a hub that has published ones, the views are stale: the figures are left out rather than printed as 0. About 4,300 small queries per run (6 per hub), at a concurrency of 4.
- **Lists of caves** hold only caves with a page, each linked, at most **100**, best documented first: the characters of the titles and bodies of the descriptions the cave page shows (its own and its published entrances'), then a known depth and a known length (0 is unknown), then the id. A list can be shorter than the number next to it.
- **Lists of regions and countries** are sorted by name (accents and case ignored, then code point, no ICU collation) and contain only hubs that are published. A region is linked with its country only when the code starts with it.
- **Massifs** on a hub are the massifs listed on a published cave of the hub (admitted, not sensitive, named: each has a page). The association is **cave-level, not spatial**: a network with one entrance in each of two regions puts its massif on both. A massif spanning two regions appears on both region hubs, and its page links to both.
- **Languages.** The hub's language is the dominant language of the main names of its published caves (the most common `v_bot_page.language`, the lowest code on a tie). **The countries index is always English**: it is about every country, and the dominant language of all caves would make it French and could flip, English labels when the front has no translation for it (`botLabels`). A country page for a country with Polish names is `lang="pl"` with English labels. Country names are `t_country.native_name`.
- **Region names** are `t_iso3166_2.name` only, never a `name_<lang>` column (#1937; a test greps every bot SQL, service, model and template, and another changes a `name_fr` and checks nothing moves). `[bracketed alternatives]` and a trailing `*` are removed (`GB-CMN` is "Carmarthenshire", `ES-NA` is "Nafarroa"). The rule is in SQL (it gates the hub) and in `cleanRegionName` (the breadcrumb of a cave page uses it); a test compares the two on the same samples. A region of a cave page is shown as the hub names it.
- **JSON-LD** is a schema.org `CollectionPage` with an `ItemList` of what the page links to. No coordinate, bounding box or polygon exists in any hub field: the whitelist names none.

**Massif page, minimum added.** Decision (#1935): the massif page gets the figures of the massif (`v_massif_info`, no count of massifs) and a list of the regions its published caves are in, as links to the published region hubs (the region hubs list the massif, so the page and the hubs agree). It is a massif that has a page already, so a sensitive massif still has none. `BotHubService.massifExtras` builds both for a batch of massifs and `render` takes them as `massifExtras`, a `Map` by massif id (whitelist type `massifExtras`, kept apart from `massif` because they are not columns of the view).

**Left out of this change.** The audit (#1887) does not check hubs yet; the sitemap shards (#1767), the Worker patterns (#1933) and the `Allow` lines of `robots.txt` (GrottoCenter/grottocenter-front#1500) are separate. The manifest keeps what they need: path, `lastmod`, `redirect_to IS NULL`, `hub_type` and `hub_key`.
