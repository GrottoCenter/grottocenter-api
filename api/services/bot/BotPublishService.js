/**
 * BotPublishService.js
 *
 * @description :: What the page generator (BotPageGeneratorService) and the
 *   withdrawal worker (BotOutboxService) share, so that both write EXACTLY the
 *   same bytes and the same manifest rows for the same row of v_bot_page or
 *   v_bot_redirect:
 *
 *   - pagePublication / redirectPublication: a row becomes the object to
 *     publish (path, HTML, sha256 of the HTML, lastmod, metadata);
 *   - publishIfChanged: uploads it when its hash differs from the manifest's,
 *     and writes the manifest row AFTER the upload;
 *   - recordPublished / forgetPublished / manifestHashes: the manifest.
 *
 * The change detector is the hash of the HTML, never v_bot_page.lastmod.
 */

const crypto = require('crypto');
const botPagePaths = require('../../utils/botPagePaths');
const BotRenderService = require('./BotRenderService');

const query = (sql, params) => CommonService.query(sql, params);

const sha256 = (html) =>
  crypto.createHash('sha256').update(html, 'utf8').digest('hex');

const manifestHashes = async (paths) => {
  if (paths.length === 0) return new Map();
  const { rows } = await query(
    'SELECT path, content_hash FROM t_bot_page_manifest WHERE path = ANY($1::text[])',
    [paths]
  );
  return new Map(rows.map((row) => [row.path, row.content_hash]));
};

const recordPublished = (page) =>
  query(
    `INSERT INTO t_bot_page_manifest (path, entity_type, entity_id, hub_type, hub_key, content_hash, lastmod, redirect_to, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT (path) DO UPDATE
       SET entity_type = EXCLUDED.entity_type,
           entity_id = EXCLUDED.entity_id,
           hub_type = EXCLUDED.hub_type,
           hub_key = EXCLUDED.hub_key,
           content_hash = EXCLUDED.content_hash,
           lastmod = EXCLUDED.lastmod,
           redirect_to = EXCLUDED.redirect_to,
           published_at = EXCLUDED.published_at`,
    [
      page.path,
      page.entityType,
      page.entityId,
      page.hubType ?? null,
      page.hubKey ?? null,
      page.hash,
      page.lastmod,
      page.redirectTo ?? null,
    ]
  );

const forgetPublished = (path) =>
  query('DELETE FROM t_bot_page_manifest WHERE path = $1', [path]);

const resolveBaseUrl = (baseUrl) =>
  baseUrl || BotRenderService.defaultBaseUrl();

/**
 * The options every render of a run shares (BotRenderService.render requires
 * them: without the same ones the bytes differ from the generator's). The maps
 * are read from the database unless given.
 *
 * @param {object} options
 * @param {string} options.baseUrl from resolveBaseUrl()
 * @param {object} options.hubLinks BotHubService.createHubLinks(hubs, baseUrl)
 * @param {Map} [options.languageTags]
 * @param {Map} [options.countryNames]
 */
const loadRenderOptions = async ({
  baseUrl,
  languageTags,
  countryNames,
  hubLinks,
}) => ({
  baseUrl,
  languageTags: languageTags || (await BotRenderService.loadLanguageTags()),
  countryNames: countryNames || (await BotRenderService.loadCountryNames()),
  hubLinks,
});

/**
 * The page of a v_bot_page row, ready to publish.
 *
 * @param {object} row a v_bot_page row
 * @param {object} renderOptions what BotRenderService.render needs
 */
const pagePublication = (row, renderOptions) => {
  const html = BotRenderService.render(row, renderOptions);
  return {
    path: botPagePaths.toKey(row.entity_type, row.entity_id),
    entityType: row.entity_type,
    entityId: row.entity_id,
    html,
    hash: sha256(html),
    lastmod: row.lastmod,
    lastmodAtUpload: row.entity_type === 'massif',
  };
};

/**
 * The redirect page of a record merged into `targetId` (a v_bot_redirect row),
 * ready to publish: a manifest row of the old record, with `redirect_to` set.
 */
const redirectPublication = (entityType, entityId, targetId, renderOptions) => {
  const html = BotRenderService.renderRedirect(
    entityType,
    targetId,
    renderOptions
  );
  return {
    path: botPagePaths.toKey(entityType, entityId),
    entityType,
    entityId,
    html,
    hash: sha256(html),
    lastmod: null,
    redirectTo: targetId,
    metadata: {
      redirectto: BotRenderService.redirectTarget(
        entityType,
        targetId,
        renderOptions
      ),
    },
  };
};

/**
 * Uploads `page` unless the manifest already holds its hash, then writes the
 * manifest row (after the upload: a crash leaves the manifest consistent with
 * what is online).
 *
 * @param {object} adapter storage adapter
 * @param {object} page a publication
 * @param {?string} knownHash the manifest's hash for page.path, if any
 * @returns {Promise<boolean>} whether the page was uploaded
 */
const publishIfChanged = async (adapter, page, knownHash) => {
  if (knownHash === page.hash) return false;
  await adapter.put(
    page.path,
    page.html,
    page.metadata ? { metadata: page.metadata } : undefined
  );
  // A hub or a massif page changes with the SPA figures and with its list
  // of caves, which v_bot_page.lastmod does not see: its manifest lastmod
  // (what the sitemaps publish) is the time of the upload, so it moves when
  // the page does and never goes back
  await recordPublished(
    page.lastmodAtUpload ? { ...page, lastmod: new Date() } : page
  );
  return true;
};

module.exports = {
  resolveBaseUrl,
  loadRenderOptions,
  sha256,
  manifestHashes,
  recordPublished,
  forgetPublished,
  pagePublication,
  redirectPublication,
  publishIfChanged,
};
