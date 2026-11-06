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

`BotPageGeneratorService.run({ adapter })` (`api/services/bot/BotPageGeneratorService.js`) is step 4 of the nightly pipeline. It publishes the pages of `v_bot_page` as static files and keeps `t_bot_page_manifest` equal to what is online. Scheduling is the [nightly pipeline](#the-nightly-pipeline); what a page contains is described in [The pages](#the-pages); the sitemaps are step 5, see [Sitemaps](#sitemaps).

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

**Manifest.** `t_bot_page_manifest (path PRIMARY KEY, entity_type, entity_id, hub_type, hub_key, content_hash, lastmod, redirect_to, published_at)` (`sql/9_32_2026_11_02_bot_page_manifest.sql`, then `sql/9_33_2026_11_03_bot_page_manifest_redirect.sql` for `redirect_to` and `sql/9_34_2026_11_04_v_bot_hub.sql` for the hubs, all applied by hand in production): one row per published path. `content_hash` is the sha256 of the rendered HTML, the change detector; `lastmod` is the view's hint at the time of the upload for a cave or an organization, and **the time of the upload for a hub or a massif page**: those change with the SPA figures and with their list of caves, which the view's hint does not see, so their `lastmod` moves when the page does and never goes back. Static extras (`404.html`) have `entity_type = 'static'` and no `entity_id`; so do the sitemap files (`sitemap.xml`, `sitemap-*.xml.gz`, see [Sitemaps](#sitemaps)), told apart by their path. **A hub has `entity_type = 'hub'`, no `entity_id`, and a `hub_type` (`index`, `country` or `region`) and a `hub_key` (`ALL`, `FR`, `FR-01`)**: the sitemaps (#1767) read the hub type from the column and the address from `botPagePaths.toHubUrl(hub_type, hub_key)`. A CHECK constraint ties the columns together (a hub has both, no id and no `redirect_to`; nothing else has either). **`redirect_to` tells a redirect page from a content page**: it is the id of the final target (same `entity_type`) on the row of a redirect page, and NULL on a content page and on the static extras. The sitemaps (#1767) list only the rows where it is NULL (a redirect page is `noindex`), and the withdrawal worker (#1886) and the audit (#1887) re-render only those rows from `v_bot_page`: a redirect row has no `v_bot_page` row and is checked against `v_bot_redirect`.

**A run.** One at a time: `run()` takes a session-level advisory lock (key 1758) on a leased connection and rejects with code `E_BOT_PAGES_RUNNING` when another run holds it, before anything is read or published. Two overlapping runs could otherwise leave a page online with no manifest row, which no later run would delete. `concurrency` and `batchSize` must be positive integers; anything else is rejected up front.

0. **Before anything else it reads the published hubs, once** (`BotHubService.loadHubs`, `v_bot_hub` by keyset, one hub type at a time). Those rows give the `hubLinks` of every page of the run and are the hubs the run publishes in step 4, so the links and the hubs cannot disagree inside a run: a hub that is withdrawn while the run goes on is published a day late, never linked and missing. The hubs are at most about 870 rows of at most 100 caves each, a few MB held for the run. A cave page changes only when a hub it links to appears or leaves, and depends on the set of hubs, not on the order they were read in.
1. For each type, one at a time, it reads `v_bot_redirect` once for that type (the merged records: a few thousand rows of two integers), then the view by keyset (`entity_id > $cursor ORDER BY entity_id LIMIT 1000`), renders and hashes each row, and uploads only the pages whose hash differs from the manifest.
2. For the same id range it publishes the redirect pages (see [Redirects](#redirects)): a page at the old record's path, as a manifest row of the old record's type and id. An id that is both in the view and in `v_bot_redirect` (the two are read apart) is published as the page.
3. In step with the view it deletes the manifest paths of the same id range that neither the batch nor the redirects hold (a record that left the view, or a redirect that is no longer produced). The manifest is never loaded whole: one batch of rows and `concurrency` rendered pages (4) are in memory at a time.
4. It publishes the hubs from the rows read in step 0, with the SPA's figures (see [Hub pages](#hub-pages)), and deletes the manifest hub paths it does not produce (a hub that stopped being published: the file, then the row). The hubs are few, so those rows are selected in one query, not walked by range.
5. It publishes the static extras, and deletes static paths it no longer produces, except the sitemap files (`sitemap.xml`, `sitemap-*.xml.gz`): they are static rows too, owned by the sitemap step.
6. The manifest is written **after** each successful upload or delete. A delete is `adapter.delete` then the manifest row removal, and deleting a path that is already gone is not an error. So a crash at any point leaves the manifest consistent with what is online, and at worst a page is uploaded again. When a call fails, nothing new is started and the calls in flight finish first, so the manifest also matches the adapter when the run rejects.

It returns `{ uploaded, unchanged, deleted, byType }`. A blob deleted by hand while its manifest row remains is not noticed (the hash still matches): the audit (#1887) compares the adapter with the manifest.

**Storage adapters** (`api/services/bot/storage/`): one interface, `put(key, body, { metadata, contentType })`, `delete(key)`, `list()`. `body` is a string (written as UTF-8) or a `Buffer` (written as is: a gzip sitemap shard). `metadata` is an optional flat object of strings (`redirectto` on a redirect page) and replaces the page's previous metadata: a page put without any has none. `contentType` defaults to `text/html; charset=utf-8`; the local adapter has nowhere to keep it and ignores it.

- `LocalStorageAdapter`: a directory, for dev and tests. The metadata of `caves/1.html` is kept in the sidecar `caves/1.html.metadata.json`, which `list()` does not report and `delete()` removes. Writes through a temporary file (`*.part`) and a rename, and refuses a key outside the root. `list()` skips the temporary files a killed process can leave behind.
- `AzureBlobStorageAdapter`: the `$web` container of an Azure Blob static website, through `@azure/storage-blob` (as `FileService`). It uploads with `Content-Type: text/html; charset=utf-8` (or the `contentType` given: `application/xml; charset=utf-8` for `sitemap.xml`, `application/gzip` for a shard) and the metadata as the blob's metadata (a Put Blob replaces the blob's metadata as a whole, so a page uploaded without any drops the `redirectto` it had; verified against a stubbed container only). The edge Worker forwards the blob's ETag and Last-Modified; the Worker never caches these pages, so no CDN purge is needed.

**Configuration** (`sails.config.custom.botSurface`, from the environment; nothing is hardcoded):

| Variable                            | Meaning                                                                                                                                            | Default                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `BOT_SURFACE_ENABLED`               | `true` starts the background jobs of the bot surface (today the withdrawal worker, see [Withdrawals](#withdrawals)); anything else leaves them off | off                           |
| `BOT_PAGES_PUBLIC_BASE_URL`         | The SPA's own address; pages live at `<base>/caves/123`                                                                                            | `https://grottocenter.org/ui` |
| `BOT_PAGES_STORAGE`                 | `local` or `azure`                                                                                                                                 | `local`                       |
| `BOT_PAGES_LOCAL_DIR`               | Directory for the `local` driver (gitignored default)                                                                                              | `.local-bot-pages`            |
| `BOT_PAGES_AZURE_CONNECTION_STRING` | Connection string of the storage account (`azure`; required)                                                                                       | none                          |
| `BOT_PAGES_AZURE_CONTAINER`         | Container name, the static website one, `$web` (`azure`; required)                                                                                 | none                          |

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

- **Figures** (number of caves, networks, massifs, diving caves, total length, average depth and length) are **the SPA's own statistics**: `BotHubService` calls `StatisticsCountryService`, `StatisticsRegionService` and `StatisticsMassifService` (which read `v_country_info`, `v_region_info` and `v_massif_info`, refreshed by `pg_cron`) and converts the results as the statistics controllers do. They may include records that are not published, and a test compares them with the `/statistics` endpoints on the same fixture. There is no "deepest" or "longest" cave and no ranking. When the statistics count no cave for a hub that has published ones, the views are stale: the figures are left out rather than printed as 0. About 4,300 small queries per run (6 per hub), at a concurrency of 4. They are worded as the SPA's statistics widget words them: the number, then the front's string for it (`8 cavités permettent de faire de la plongée`, `456789 m Développement cumulé`), with the ICU plural form the front uses when it has one (`pluralText`), picked with the plural rules of the language the labels are in (English for a page whose language the front does not translate, so a Russian page reads "21 caves"). The heading of a list of caves is the front's lowercase `caves` ("cavités"), capitalized: the front's `Caves` reads "Réseaux" in French, like `Networks`.
- **Lists of caves** hold only caves with a page, each linked, at most **100**, best documented first: the characters of the titles and bodies of the descriptions the cave page shows (its own and its published entrances'), then a known depth and a known length (0 is unknown), then the id. A list can be shorter than the number next to it.
- **Lists of regions and countries** are sorted by name (accents and case ignored, then code point, no ICU collation) and contain only hubs that are published. A region is linked with its country only when the code starts with it.
- **Massifs** on a hub are the massifs listed on a published cave of the hub (admitted, not sensitive, named: each has a page). The association is **cave-level, not spatial**: a network with one entrance in each of two regions puts its massif on both. A massif spanning two regions appears on both region hubs, and its page links to both.
- **Languages.** The hub's language is the dominant language of the main names of its published caves (the most common `v_bot_page.language`, the lowest code on a tie), with English labels when the front has no translation for it (`botLabels`). **The countries index is always English**: it is about every country, and the dominant language of all caves would make it French and could flip. A country page for a country with Polish names is `lang="pl"` with English labels. Country names are `t_country.native_name`.
- **Region names** are `t_iso3166_2.name` only, never a `name_<lang>` column (#1937; a test greps every bot SQL, service, model and template, and another changes a `name_fr` and checks nothing moves). `[bracketed alternatives]` and a trailing `*` are removed (`GB-CMN` is "Carmarthenshire", `ES-NA` is "Nafarroa"). The rule is in SQL (it gates the hub) and in `cleanRegionName` (the breadcrumb of a cave page uses it); a test compares the two on the same samples. A region of a cave page is shown as the hub names it.
- **JSON-LD** is a schema.org `CollectionPage` with an `ItemList` of what the page links to. No coordinate, bounding box or polygon exists in any hub field: the whitelist names none.

**Massif page, minimum added.** Decision (#1935): the massif page gets the figures of the massif (`v_massif_info`, no count of massifs) and a list of the regions its published caves are in, as links to the published region hubs (the region hubs list the massif, so the page and the hubs agree). It is a massif that has a page already, so a sensitive massif still has none. `BotHubService.massifExtras` builds both for a batch of massifs and `render` takes them as `massifExtras`, a `Map` by massif id (whitelist type `massifExtras`, kept apart from `massif` because they are not columns of the view).

**Left out of this change.** The audit (#1887) does not check hubs yet; the Worker patterns (#1933) and the `Allow` lines of `robots.txt` (GrottoCenter/grottocenter-front#1500) are separate. The manifest keeps what they need: path, `lastmod`, `redirect_to IS NULL`, `hub_type` and `hub_key`.

## Sitemaps

`BotSitemapService.run({ adapter })` (`api/services/bot/BotSitemapService.js`, #1767) is step 5 of the nightly pipeline: the pipeline (#1760) calls it **after** the page generator, with the same adapter. It is a service of its own rather than the generator's last step, so it can be re-run alone (after a failed upload, or to change `entityTypes`) without rendering a page. It builds the sitemaps from **`t_bot_page_manifest`**, the record of what is online, and never from the views: a sitemap cannot list a page that does not exist, nor miss one that does. The edge Worker (#1933) serves the files to everyone; the `Sitemap:` line of the apex `robots.txt` is GrottoCenter/grottocenter-front#1500.

| File                               | Holds                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `sitemap.xml`                      | the index: one `<sitemap>` per shard, `<lastmod>` = when that shard file last changed        |
| `sitemap-caves-<k>.xml.gz`         | the caves with an id in `[k·50 000, (k+1)·50 000)`                                           |
| `sitemap-massifs-<k>.xml.gz`       | the same for the massifs                                                                     |
| `sitemap-organizations-<k>.xml.gz` | the same for the organizations                                                               |
| `sitemap-hubs.xml.gz`              | every hub: the countries index, then the countries, then the regions, each sorted by its key |

**Every file is at the root of the site**, next to `sitemap.xml`. The protocol scopes a sitemap file to the URLs under its own directory ("a Sitemap file located at http://example.com/catalog/sitemap.xml can include any URLs starting with http://example.com/catalog/"), and the pages are under `/ui/`: a shard under `/sitemaps/` could not list them for a strict crawler. A file at the root can list any URL of the host. No page has a root path that starts with `sitemap-`.

- **What is listed.** The manifest rows with `redirect_to IS NULL` of the types asked for. Redirect pages (`noindex`) and the static rows (`404.html`, the sitemap files themselves) are left out. Each URL has only `<loc>`, the page's address from `botPagePaths` (`toUrl`, `toHubUrl`), and `<lastmod>`, the manifest's `lastmod` as a W3C datetime in UTC, to the microsecond (`2026-03-02T10:00:00.123456Z`, one fixed format so the strings sort like the instants); no `<changefreq>`, no `<priority>`. A row without `lastmod` gets no `<lastmod>`. The files are served from the origin of `publicBaseUrl` (`https://grottocenter.org/sitemap.xml`, `https://grottocenter.org/sitemap-caves-0.xml.gz`); `siteUrl` overrides it.
- **Shards are fixed id ranges.** `botSitemap.shardKey(type, id)` (`api/utils/botSitemap.js`, pure, property-tested) is `floor(id / 50000)`, so a shard can never exceed the protocol's 50,000 URLs and a page never moves to another shard as others are added. An empty range has no file.
- **Hubs in one shard.** The hubs are at most about 870 URLs, far under the limit, so they are a single `sitemap-hubs.xml.gz`, ordered by hub type (`index`, `country`, `region`) then by key (byte order). The run refuses to write a shard of more than 50,000 URLs rather than split it.
- **Change detection.** Each file's XML (before gzip, whose bytes may change with the zlib version) is hashed (sha256) and the hash kept in the manifest as a **static row of that path**; no migration was needed, the manifest constraints already allow it. A file whose hash did not change is not uploaded, so an unchanged night uploads nothing. A change of a `lastmod` alone changes the shard.
- **The `<lastmod>` of a shard in the index is when the file last changed**, kept in the shard's manifest row: the time of the run that uploaded it, and the stored value while its hash is unchanged. Never an entry's date: one could lie in the future (a future-dated manifest row), and the shard's date would go back once that entry left it. The latest `lastmod` of its entries would miss a URL leaving the shard: the file changes but the date does not, or even goes back, and a crawler reading the index would not fetch the shard again. An unchanged night keeps every date, so the index is unchanged too.
- **Order.** Shards are uploaded first, then the index, then the shards no longer produced (a range or a type that became empty) are deleted: a crawler never reads an index that names a missing shard. When no shard is left at all the index is deleted first (an empty index is not valid). As for the pages, the manifest row of a file is written after its upload and removed after its delete.
- **Memory.** The manifest of one type is read by keyset (`batchSize`, 5,000 rows); at most one shard (50,000 short strings) is held at a time, plus the list of shards for the index.
- **Lock.** `run()` takes the page generator's advisory lock (key 1758) and rejects with `E_BOT_PAGES_RUNNING` while a generation run holds it, so the sitemaps never read a manifest that is being written, and a generation run cannot start while they are written.
- **Entity types.** `entityTypes` (default: `cave`, `massif`, `organization` and `hub`, all of them) lists the types the sitemaps include; the shards of a type left out are deleted at the next run. The pipeline passes `BOT_SURFACE_ENTITY_TYPES` here (see [The allow-list](#the-allow-list)).
- **Same-day removals** (#1886) are dropped from the shards at the next nightly run; until then a shard can list a URL that already answers the 404 page, which is accepted (the record was public until that day).
- **Tests.** `test/integration/1_services/BotSitemapService.test.js` runs the service with the local adapter over manifest rows and checks every file against the rules of the sitemaps 0.9 schemas (`sitemap.xsd`, `siteindex.xsd`: root and namespace, `<loc>` first and once, at most one `<lastmod>` in W3C datetime, nothing else, 1 to 50,000 entries, 50 MB at most), parsed with `fast-xml-parser` (a dev dependency, already in the tree through `@azure/storage-blob`). There is no XSD validator: the JS ones need native bindings or a JVM, and `xmllint` is not in CI.

## The nightly pipeline

One pg-boss job, `bot-surface-nightly` (#1760), runs the six steps in order. `BotPipelineQueueService` (`api/services/BotPipelineQueueService.js`) schedules it, next to the other Node-side schedules (`SearchOutboxQueueService`, `DbExportQueueService`), and `BotPipelineService` (`api/services/bot/BotPipelineService.js`) holds the steps, the stop rules and the run record. `pg_cron` could not do this: one independent job per step cannot stop the next one, and several steps are Node code.

| Step | Name         | What                                                                        | On failure                                                                                 |
| ---- | ------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1    | `invariant`  | `bot_cascade_check()`; a violation is a failure                             | **stop**; nothing is uploaded or deleted                                                   |
| 2    | `scan`       | `BotTextScanService.run()`                                                  | **stop**                                                                                   |
| 3    | `admission`  | `bot_admit_pages()`                                                         | **stop**                                                                                   |
| 4    | `generation` | `BotPageGeneratorService.run({ adapter, entityTypes })`                     | **stop**; the manifest stays consistent with what is online                                |
| 5    | `sitemaps`   | `BotSitemapService.run({ adapter, entityTypes })`                           | the previous sitemaps stay; the run is recorded as failed at step 5, and step 6 still runs |
| 6    | `audit`      | **hook, not built yet** (#1887): records `{ "skipped": "not implemented" }` | handled by #1887                                                                           |

**The order is the contract.** The scan runs before admission because the content rule reads the verdicts: a description written 30 days ago and scanned tonight counts for admission tonight. Admission runs before generation: a record that turns 30 days old tonight is published tonight. Both are tested end to end over real rows.

**The audit hook.** Step 6 is `BotPipelineService.steps.audit`. #1887 replaces its body, returns its counts (pages audited, failures) and throws to fail the run; the orchestrator, the run table and the alert do not change.

### Configuration

| Variable                   | Default      | Meaning                                                                                                                                                        |
| -------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BOT_SURFACE_ENTITY_TYPES` | empty        | The allow-list, comma-separated among `cave`, `massif`, `organization`, `hub` (any case, any order). An unknown name stops the startup with the accepted ones. |
| `BOT_SURFACE_ENABLED`      | `false`      | Turns on the **schedule** of the pipeline and the withdrawal worker. A manual run does not need it.                                                            |
| `BOT_SURFACE_SCHEDULE`     | `30 1 * * *` | Cron expression, five fields, read in **UTC**. Validated at startup. **The default is provisional**: the real time is chosen from the traffic measurements.    |
| `BOT_PAGES_STORAGE` et al. | `local`      | The storage adapter (see [The page generator](#the-page-generator)). The local driver is refused in production.                                                |

`sails.config.custom.botSurface` holds them (`enabled`, `entityTypes`, `schedule`, `storage`), parsed by `api/utils/botSurfaceConfig.js`.

**Schedule.** The default, 01:30 UTC every day, avoids the other heavy jobs: `pg_cron` at 04:20 daily, 04:30 (bot outbox trim) and 04:40, 04:45, 04:50 every 3 days, and the database export on Sundays at 03:00. With `missed: 'once'`, a night the API was down is run once when it comes back, like the weekly export.

### Two switches

| Entity types listed | Storage valid | `BOT_SURFACE_ENABLED` | Worker                      | Schedule                               |
| ------------------- | ------------- | --------------------- | --------------------------- | -------------------------------------- |
| no                  | any           | any                   | no                          | no (a leftover one is not removed)     |
| yes                 | no            | any                   | startup fails and is logged | no                                     |
| yes                 | yes           | `false`               | yes                         | **no**; an earlier schedule is removed |
| yes                 | yes           | `true`                | yes                         | yes                                    |

The **worker** (the pg-boss handler that runs the pipeline) registers as soon as the surface is configured, so that `npm run bot-surface:run` has something to run it; it does nothing until a job is in the queue. The **schedule** is the only thing `BOT_SURFACE_ENABLED` adds. The withdrawal worker (`BotOutboxQueueService`) is unchanged: it still depends on `BOT_SURFACE_ENABLED` alone. Switching `BOT_SURFACE_ENABLED` off unschedules the nightly job on the next startup.

**Going to production.** Set `BOT_SURFACE_ENTITY_TYPES` and the Azure storage, leave `BOT_SURFACE_ENABLED` unset, deploy, run `npm run bot-surface:run` by hand, read the run record (and take the baseline, below), and only then set `BOT_SURFACE_ENABLED=true`.

**Emptying the list.** An empty list means nothing is generated and nothing is scheduled (a schedule left by an earlier configuration is removed at startup). It also means no run deletes what an earlier run published: removing the _last_ type from the list does not take its pages down. To roll back every type, follow the launch runbook (#1888: disable the Worker route first) and delete the pages with `BotPageGeneratorService.run({ adapter, entityTypes: [] })`, which deletes all of them; removing one type while another stays listed is handled by the next run.

### The allow-list

`BOT_SURFACE_ENTITY_TYPES` (#1888) is read at startup into `botSurface.entityTypes` and enforced in three places:

- **The generator** (`entityTypes` option, default: all four). Only the listed types are rendered and published. The pages, the redirect pages and the manifest rows of a type that is **not** listed are **deleted** on the next run (the file first, then the row, as everywhere). Without `hub` in the list, no hub is published, **no page links to a hub** (the breadcrumbs and lists link to a hub only when it is published), and the hub pages already online are deleted.
- **The sitemaps** (`entityTypes` option, already there). The shards of a type that is not listed are deleted, and the index stops naming them. They are built from the manifest, so they follow the deletes above.
- **The withdrawal worker** (`BotOutboxService.run({ entityTypes })`, the three page types by default). It never publishes a type that is not listed: such a page reads as absent, so a file that is online is deleted and nothing is uploaded. It leaves the hubs to the nightly run, as before.

Pages of a listed type may still link to a page of a type that is not listed (a cave page lists its massifs): the link is the SPA's own address, which always answers; only the static page is missing. List `cave`, `massif` and `hub` together when the hubs should list what is published.

### Waiting for the page lock

The generator and the sitemaps take the advisory lock 1758 and reject with `E_BOT_PAGES_RUNNING` while it is held. The withdrawal worker holds it for up to about 45 seconds every minute, so steps 4 and 5 **retry**: every 5 seconds, up to 60 attempts (about 5 minutes), each step on its own. After that the step fails with `E_BOT_PAGES_LOCK_TIMEOUT` and a message naming the step, and the run is recorded as failed at that step. An error other than `E_BOT_PAGES_RUNNING` is never retried.

### One run at a time

The queue has the `exclusive` policy: pg-boss keeps at most one `bot-surface-nightly` job queued or running across all API instances, so an enqueue while one is queued or running is refused (and a second scheduled firing is too). `BotPipelineService.run` also takes a session-level advisory lock (key 1760) for the whole run and rejects with `E_BOT_PIPELINE_RUNNING` when it is held, so a direct call cannot overlap either. Because that lock proves no other run is alive, a row left `running` by a process that died is marked `failed` ("abandoned") by the next run.

`expireInSeconds` is **4 hours**, `retryLimit` 0. The first full publication (about 11,000 cave pages plus hubs, redirect pages and sitemaps) has **not been measured**; a typical night changes few pages. A job killed by a restart stays active until it expires and blocks the exclusive queue, a manual run included, so the value is not padded: 4 hours is far above a plausible run and well under the 24 hours between two nights. If the first run comes close to it, raise it in `QUEUE_OPTIONS`. A failed run is not retried at once: it stopped for a reason, the run table says which, and the next night starts again. The job's abort signal (at expiry or on shutdown) stops the run before its next step.

### The run record

`t_bot_pipeline_run` (`sql/9_38_2026_11_06_bot_pipeline_run.sql`, applied by hand in production like the other bot migrations: production does not run migrations on deploy). One row per run, inserted when it starts and updated after every step, so a crash leaves what was done.

| Column           | Holds                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `id`             | serial                                                                                                 |
| `started_at`     | start of the run                                                                                       |
| `finished_at`    | end of the run; `NULL` while it runs                                                                   |
| `status`         | `running`, `succeeded` or `failed`                                                                     |
| `failed_step`    | 1 to 6 (see the table above); `NULL` unless the run failed                                             |
| `step_durations` | jsonb, milliseconds by step name (`invariant`, `scan`, `admission`, `generation`, `sitemaps`, `audit`) |
| `counts`         | jsonb, below                                                                                           |
| `error`          | the code and message of the failure; `NULL` otherwise                                                  |

`counts` holds: `trigger` (`schedule` or `manual`), `entityTypes`; `invariant` (`violations`, `overrides`); `scan` (`patternVersion`, **`scanned` and `quarantined` per source**, `t_description` and `t_name`, `errors`, `passes`); `admission` (**admitted tonight** per type, and `total`); `generation` (`uploaded`, `unchanged`, `deleted`, `byType`, and the pages online after the run: **`pages` and `redirects` per type**); `sitemaps` (`uploaded`, `unchanged`, `deleted`, `shards`, `urls`); `audit` (`{ "skipped": "not implemented" }` until #1887); `peakRssMb` (the API process's resident set, sampled every second during the run and after each step). A failed step holds `{ "failed": true }`, and the steps after a stop are absent.

**Retention.** Each run deletes the rows older than **one year** when it starts: about 365 small rows are kept, enough to see a trend, and the table needs no cron job.

```sql
-- Last runs
SELECT id, status, failed_step, started_at, finished_at, step_durations, counts->'peakRssMb' AS peak_rss_mb, error
  FROM t_bot_pipeline_run ORDER BY id DESC LIMIT 10;

-- True when there is no successful run in the last 26 hours (the alert, in SQL)
SELECT coalesce(max(finished_at) < now() - interval '26 hours', true) AS stale
  FROM t_bot_pipeline_run WHERE status = 'succeeded';
```

### Logs and the alert

- Success, `info`: `bot-surface-nightly succeeded (run 42): admitted=17 scanned=212 quarantined=3 uploaded=120 deleted=4 unchanged=11050 sitemapUrls=11170 shards=5 audit=skipped peakRssMb=612.4 durationMs=184233`.
- Failure, one `error` line per failed step: `bot-surface-nightly failed at step <n> (<step label>): <message>`, with the error and its stack. `BotTextScanService` and the steps keep their own lines.
- A run that waits for the lock logs an `info` line per attempt: `bot-surface-nightly: generation waits for the page lock (attempt 3 of 60)`.

The `pg_cron` alert does not see pg-boss jobs. Both alerts below read the App Service console logs, like the ones in [Request logging](request-logging.md); create them in the infrastructure repository.

```kusto
// Alert 1: no successful run in 26 hours. Fire when the result has a row
// with successes == 0. Evaluate every hour. Does not make sense until the schedule is on.
AppServiceConsoleLogs
| where TimeGenerated > ago(26h)
| summarize successes = countif(ResultDescription has "bot-surface-nightly succeeded")
| where successes == 0

// Alert 2: a failed run. Fire when the result has a row. Evaluate every 15 minutes.
AppServiceConsoleLogs
| where TimeGenerated > ago(15m)
| where ResultDescription has "bot-surface-nightly failed at step"
| project TimeGenerated, ResultDescription
```

The App Service log agent sends console output in batches: allow a few minutes of delay. For alert 1, the SQL above is the source of truth.

### Manual trigger

```shell
npm run bot-surface:run
```

`scripts/bot-surface-run.js` puts one `bot-surface-nightly` job in the queue and exits; there is no HTTP endpoint. It lifts Sails without its bootstrap (no worker starts in the script), opens its own pg-boss connection with the same settings as the API, and refuses cleanly (exit code 1, a message, nothing sent) when `BOT_SURFACE_ENTITY_TYPES` lists no type or the storage is invalid. It also reports, and exits 1, when a run is already queued or running (the queue is `exclusive`). It does **not** run the pipeline itself and does not wait for it: **an API instance started with the same configuration must be running**, because that instance's worker takes the job. Follow the run in `t_bot_pipeline_run` (the SQL above) or in the logs. Run it where the environment variables are set (SSH on the Web App), like `scripts/resync-search.js`.

### The production-scale baseline (owed by #1759 and #1760)

The tables are empty in production until the first run, so the baseline **cannot be taken before it** and is not in the pull request that built the pipeline. After the first run (the first full publication), record, in a comment on #1760, separately for that run and for a typical incremental night a week later:

1. **Per-step durations and peak RSS**, from the run table: `SELECT step_durations, counts->'peakRssMb', counts->'generation'->'byType' FROM t_bot_pipeline_run ORDER BY id LIMIT 2;`.
2. **One keyset batch of `v_bot_page` per type**, read-only, as the generator reads it:

   ```sql
   EXPLAIN (ANALYZE, BUFFERS)
   SELECT entity_type, entity_id, language, lastmod, page
     FROM v_bot_page
    WHERE entity_type = 'cave' AND entity_id > 0
    ORDER BY entity_id LIMIT 1000;
   ```

   Repeat for `massif` and `organization`, and for one batch deep in the id range (`entity_id > 50000`). The total read time of the view is the sum over the batches (about 11 for the caves at stage 1): the generation step's duration minus the rendering and the uploads is the upper bound.

3. **The one read of `v_bot_hub`** (`EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM v_bot_hub;`) and **of `v_bot_redirect`** per type (`... WHERE entity_type = 'cave' ORDER BY entity_id`), which the generator reads once per run and once per type.
4. **Postgres CPU credits before and after the run**: the Azure metric _CPU Credits Remaining_ of the Flexible Server (Burstable), read just before the run and at the end of the step durations, e.g. `az monitor metrics list --resource <server id> --metric cpu_credits_remaining --interval PT1M`.

If a full read of `v_bot_page` is too slow, materialize it: that changes how the pipeline reads, not the policy. If the first run comes close to `expireInSeconds`, raise it.

## Withdrawals

Pages are generated once a night. A change that must take a page down (an entrance marked sensitive, a massif turned sensitive, a record deleted or merged) cannot wait for it, so a worker removes or re-renders the affected pages within minutes (#1886). Publishing new pages stays nightly by design (admission, the text scan and the 30-day age gate).

**Change capture: `t_bot_outbox`** (`sql/9_37_2026_11_06_bot_outbox.sql`, applied by hand in production, like the other bot migrations; the last part, the pg_cron trim job, runs as the owner of the jobs). It has the shape of `t_search_outbox` and is filled by the **same trigger functions** (`search_outbox_enqueue`, `search_outbox_enqueue_refs`), in the transaction of the write, with one more `INSERT`. It is a table of its own, not a shared one: the search drain deletes the rows it has processed, and a cursor per consumer on a `bigserial` is unsafe (transactions commit out of order), so sharing would have tied the production search sync to this worker. The search insert in the functions is unchanged and unconditional: `t_search_outbox` receives exactly the rows it did before, and the search drain and its tests are untouched.

- **Which writes.** Only the kinds a page is built from: `entrance`, `cave`, `massif`, `organization` (with the same `old_values`), the `*_name` kinds of the same four entities, and `entrance_description`, `cave_description`, `massif_description` (a new trigger on `t_description`, `bot_outbox_enqueue_refs`). Documents, cavers, devices, comments and the data quality job enqueue nothing here. An `UPDATE` that changes nothing enqueues nothing.
- **A rename is not an event.** An `UPDATE` of a `t_name` row that changes only its text, its language or who reviewed it is not sent to `t_bot_outbox` (it still is to `t_search_outbox`). The page shows a name only while the scan has cleared its current text, so a typo fix would make the page disappear (no scanned main name, no page) until the night's scan, and with it the links to it and its redirect pages, to be fetched again. The old page holds the old name, which has already passed the scan, so it can stay: the nightly run scans the new name and renders the page with it. Any other change of a name (`is_main`, `is_deleted`, the entity it belongs to), and every insert and delete, is still an event, so a name that is removed or no longer the main one takes effect within minutes. Two consequences: a name whose text a moderator replaces stays on the page with its old text until the night; and when another event reaches the page while its name is edited and not yet scanned (a description edited the same day, say), the worker reads the view, finds no row, and withdraws the page until the night, which is the safe direction.
- **Cost.** One more small `INSERT` per write to those tables, in the same transaction. Not measured under production write load.
- **Retention.** A worker that is off or failing must not make the table grow without bound. `bot_outbox_trim()` deletes the rows older than 14 days; the worker calls it at the start of each run and a daily pg_cron job (`Trim bot outbox daily`, 4h30) calls it too, so it holds even when the worker is off. What a trimmed row would have done is done by the nightly run, which compares every page with `v_bot_page`: the only cost is that the page leaves at night instead of within minutes.

**The worker.** `BotOutboxQueueService` (`api/services/BotOutboxQueueService.js`) is a pg-boss job every minute with the `exclusive` policy, registered next to the search outbox one in `config/bootstrap.js`. It is **off unless `BOT_SURFACE_ENABLED=true`** (`sails.config.custom.botSurface.enabled`) and writes to the storage adapter of `botSurface.storage`; a misconfigured storage fails at start, not every minute. `BotOutboxService.run` (`api/services/bot/BotOutboxService.js`) does the work:

1. **Lock.** It takes the generator's advisory lock (key 1758). When a generation or sitemap run holds it, the minute is **skipped**: nothing is read, the rows stay for the next run, and one `info` line says so (no error). The worker holds the lock for its run (a time budget of 45 s, plus the batch under way), so the nightly pipeline retries on `E_BOT_PAGES_RUNNING` rather than fail (see [Waiting for the page lock](#waiting-for-the-page-lock)). The worker respects the [allow-list](#the-allow-list): it never publishes a type that is not listed.
2. **Trim**, then read a batch of 500 rows, oldest first.
3. **Fan-out to pages.** The search fan-out (`expand` in `api/dbSync/searchOutbox.js`) is reused, with every row of a table read as a delete: a page does not depend on which column changed (`is_sensitive`, which the search fan-out ignores, is exactly what removes a page), so the old and the current cave and massifs are always followed. An entrance affects its cave page and the massif pages around its old and current point; a cave its own page and the massifs that hold its entrances; a massif its page and the cave pages of the entrances inside its old and current polygon (a cave page lists its massifs); an organization its page; a name or a description the page of the entity. The records merged into an affected one are added, since their redirect page points to the final target of the chain.
4. **Per page**, re-reads `v_bot_page` by `(entity_type, entity_id)` (the same view as the nightly run), through the code the generator uses (`BotPublishService`): **row present** → render and upload when the hash differs from the manifest's; **no row but merged into a publishable target** (`v_bot_redirect`) → publish the redirect page like the generator; **neither** → delete the file, then the manifest row. It can never publish what the nightly run would not: same views, same renderer, same gates.
5. **Delete the rows**, by the exact ids it read, only after every page of the batch is handled. A failure anywhere (storage down, database error, job aborted) leaves the batch in the outbox and the next run starts it again; everything above is idempotent. No new batch starts once the time budget is spent (the first batch of a run always completes).

**Same bytes as the nightly run.** The render options (`languageTags`, `countryNames`, `hubLinks`, and `massifExtras` for a massif) and the page and manifest code are shared with the generator (`BotPublishService`, `BotHubService`), and a test compares the files the worker writes with the generator's byte for byte, breadcrumb links to a published hub included.

**Hubs are left to the nightly run.** The worker never re-renders or deletes a hub page and never reads `v_bot_hub`, which rebuilds every published cave (far too heavy every minute). It only needs the hub KEYS, to link a page to the same hubs the nightly run does: it reads them from the manifest (`entity_type = 'hub'`), and finds the region hubs of a massif from the pages of its caves (`BotHubService.regionsOfMassifs`). So a hub may list a withdrawn cave's name until the next night; the cave's page and details are gone within minutes. The same goes for the sitemap shards (see [Sitemaps](#sitemaps)).

**Logging.** One line per run, parsed by nothing yet but kept stable:

```text
BotOutboxQueueService: run rows=4 pages=5 rendered=5 uploaded=1 redirected=1 deleted=2 unchanged=1 pending=0 oldestSeconds=0 durationMs=213
BotOutboxQueueService: run skipped, a generation or sitemap run holds the lock pending=12 oldestSeconds=95 durationMs=4
BotOutboxQueueService: run failed pending=12 oldestSeconds=95 durationMs=40 <error>
```

`pending` and `oldestSeconds` are what the outbox holds after the run (-1 when it could not be read): an `oldestSeconds` that keeps growing means the worker is stuck or skipping.

**Known limit.** A crash between a page's upload and its manifest row leaves a page online that no manifest row names; neither the worker nor the nightly run removes it. The audit (#1887) compares the adapter with the manifest.

### Asking search engines to drop a page

**Deleting our page does not clear a search index that has already crawled it.** The worker makes the next fetch answer the not-found page; Google and Bing keep the old result until they recrawl, which can take days. For a page that must disappear now (a sensitive location published by mistake), also ask them (the launch runbook, #1888, links here):

- **Google Search Console** → property of the site → **Removals** → **New request** → _Temporary removal_ of the URL (or of all URLs with a prefix), which hides it for about six months while the page returns 404/410. Open it from the property that owns `grottocenter.org`.
- **Bing Webmaster Tools** → **Block URLs** (under _Configure my site_) → _Block URL_, with the page address, choosing _Remove from cache and search results_.

Do both as soon as the page is withdrawn, and check that the public address now answers the not-found page first (a removal request for a page that still answers 200 is refused or reverted).
