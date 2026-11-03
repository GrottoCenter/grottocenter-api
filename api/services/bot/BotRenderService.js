/**
 * BotRenderService.js
 *
 * @description :: Turns one v_bot_page row into one HTML string. The generator,
 *   the withdrawal worker (#1886) and the audit (#1887) all call this function,
 *   so there is a single render path.
 *
 * Uses ejs.render with the templates under views/bot/, not res.view: the Sails
 * view config and the email templates stay untouched.
 *
 * The page is built in two steps. api/utils/botPageModel.js turns the row into
 * a model (whitelist projection, language, labels, country names, title,
 * description, breadcrumb); the templates (views/bot/{cave,massif,organization}.ejs
 * inside views/bot/layout.ejs) and the JSON-LD (api/utils/botJsonLd.js) read
 * that model and nothing else. The layout gives every page the doctype, the
 * language, the title, the description, the canonical link, the OG tags, the
 * JSON-LD block, minimal inline CSS and no external asset, a header, the data
 * licence footer (CC-BY-SA for texts, ODbL for data, as in the SPA footer) and
 * <meta name="generator" content="gc-static-pages">, which the audit uses to
 * recognise a generated page.
 *
 * Output depends only on the row, the public base URL, the language tags and
 * the country names, and it does not include `lastmod`, so a record whose only
 * change is that hint renders the same bytes and is not published again.
 *
 * Pure with respect to the database: loads without Sails when the base URL is
 * passed (loadLanguageTags and loadCountryNames are the two functions that read it).
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const botPagePaths = require('../../utils/botPagePaths');
const { buildPageModel, NO_HUB_LINKS } = require('../../utils/botPageModel');
const { buildJsonLd, serializeForScript } = require('../../utils/botJsonLd');

const VIEWS_DIR = path.join(__dirname, '../../../views/bot');
const BRAND = 'Grottocenter';

// Each template is read and compiled once per process; ejs resolves includes
// from `filename` and caches them under it.
const compiled = new Map();
const renderTemplate = (name, data) => {
  const filename = path.join(VIEWS_DIR, `${name}.ejs`);
  if (!compiled.has(filename)) {
    compiled.set(
      filename,
      ejs.compile(fs.readFileSync(filename, 'utf8'), { filename, cache: true })
    );
  }
  return compiled.get(filename)(data);
};

const BODY_TEMPLATES = {
  cave: 'cave',
  massif: 'massif',
  organization: 'organization',
};

const publicBaseUrl = () =>
  (typeof sails !== 'undefined' &&
    sails.config &&
    sails.config.custom &&
    sails.config.custom.botSurface &&
    sails.config.custom.botSurface.publicBaseUrl) ||
  botPagePaths.DEFAULT_PUBLIC_BASE_URL;

const layout = (data, baseUrl) =>
  renderTemplate('layout', { ...data, siteUrl: baseUrl });

module.exports = {
  NO_HUB_LINKS,

  /**
   * @param {{entity_type: string, entity_id: number, language: string, page: object}} row
   *   a v_bot_page row
   * @param {object} options
   * @param {string} [options.baseUrl] the SPA's address (default: the config key)
   * @param {Map<string, string>} options.languageTags
   *   required, what loadLanguageTags() returns (an empty Map keeps every
   *   3-letter code). Every caller that publishes or compares a page passes the
   *   same map, or its bytes would differ from the generator's.
   * @param {Map<string, string>} options.countryNames
   *   required, what loadCountryNames() returns (an empty Map shows the country
   *   code). Same reason as languageTags.
   * @param {{country: Function, region: Function}} options.hubLinks
   *   required, the breadcrumb's hook for the hub pages (#1935); pass
   *   NO_HUB_LINKS until they exist. Same reason as languageTags: a caller that
   *   forgot it would render pages without the links the generator wrote.
   * @returns {string} the HTML document
   */
  render(
    row,
    { baseUrl = publicBaseUrl(), languageTags, countryNames, hubLinks } = {}
  ) {
    if (!(languageTags instanceof Map)) {
      // Without them a page renders `fra` instead of `fr`: another hash for the
      // same record, which the withdrawal worker and the audit would read as a change
      throw new TypeError(
        'BotRenderService.render needs languageTags (see loadLanguageTags)'
      );
    }
    if (!(countryNames instanceof Map)) {
      // Likewise: a page without them shows `FR` where the generator wrote `France`
      throw new TypeError(
        'BotRenderService.render needs countryNames (see loadCountryNames)'
      );
    }
    if (
      !hubLinks ||
      typeof hubLinks.country !== 'function' ||
      typeof hubLinks.region !== 'function'
    ) {
      // Likewise: the breadcrumb of a page rendered without them has no links
      throw new TypeError(
        'BotRenderService.render needs hubLinks ({ country, region }, NO_HUB_LINKS until the hubs exist)'
      );
    }
    const bodyTemplate = BODY_TEMPLATES[row.entity_type];
    if (!bodyTemplate) {
      throw new RangeError(`Cannot render entity type ${row.entity_type}`);
    }
    const model = buildPageModel(row, {
      baseUrl,
      languageTags,
      countryNames,
      hubLinks,
    });
    return layout(
      {
        lang: model.lang,
        dir: model.dir,
        title: model.title,
        description: model.description,
        canonicalUrl: model.url,
        ogImage: model.ogImage,
        jsonLd: serializeForScript(buildJsonLd(row.entity_type, model)),
        body: renderTemplate(bodyTemplate, { model }),
      },
      baseUrl
    );
  },

  /**
   * The page published at the old address of a merged record: it sends the
   * visitor to the final target (meta refresh), names the target as its
   * canonical, and asks not to be indexed. The edge Worker answers a crawler
   * with a 301 to the same target when it has the blob's `redirectto`
   * metadata, which the generator sets from redirectTarget().
   *
   * @param {'cave'|'massif'|'organization'} entityType
   * @param {number} targetId the final target of the merge chain
   */
  renderRedirect(entityType, targetId, { baseUrl = publicBaseUrl() } = {}) {
    const targetUrl = botPagePaths.toUrl(entityType, targetId, baseUrl);
    return layout(
      {
        lang: 'en',
        title: BRAND,
        canonicalUrl: targetUrl,
        robots: 'noindex',
        refreshUrl: targetUrl,
        body: renderTemplate('redirect', { targetUrl }),
      },
      baseUrl
    );
  },

  /** The address a redirect page points to, also the `redirectto` metadata. */
  redirectTarget(entityType, targetId, { baseUrl = publicBaseUrl() } = {}) {
    return botPagePaths.toUrl(entityType, targetId, baseUrl);
  },

  /**
   * The ISO 639-1 subtag of every language that has one, keyed by its ISO 639-3
   * code, for render(). Read once per run; needs Sails.
   *
   * @returns {Promise<Map<string, string>>}
   */
  async loadLanguageTags() {
    const { rows } = await CommonService.query(
      'SELECT id, part1 FROM t_language WHERE part1 IS NOT NULL'
    );
    return new Map(
      rows.map((row) => [
        row.id.trim().toLowerCase(),
        row.part1.trim().toLowerCase(),
      ])
    );
  },

  /**
   * The name of every country, for render(): ISO 3166-1 alpha-2 code ->
   * t_country.native_name, the one name column kept (#1939). Read once per
   * run; needs Sails.
   *
   * @returns {Promise<Map<string, string>>}
   */
  async loadCountryNames() {
    const { rows } = await CommonService.query(
      'SELECT iso, native_name FROM t_country'
    );
    return new Map(
      rows.map((row) => [row.iso.trim().toUpperCase(), row.native_name])
    );
  },

  /** 404.html: the opaque page for any address that is not published. */
  renderNotFound({ baseUrl = publicBaseUrl() } = {}) {
    return layout(
      {
        lang: 'en',
        title: 'Page not found - Grottocenter',
        robots: 'noindex',
        body: renderTemplate('not-found', {}),
      },
      baseUrl
    );
  },
};
