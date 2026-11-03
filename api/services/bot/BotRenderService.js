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
 * The layout (views/bot/layout.ejs) gives every page: the doctype, the language
 * of the record, a title, the viewport, minimal inline CSS and no external
 * asset, a header, the data licence footer (CC-BY-SA for texts, ODbL for data,
 * as in the SPA footer) and <meta name="generator" content="gc-static-pages">,
 * which the audit uses to recognise a generated page.
 *
 * The page bodies (views/bot/{cave,massif,organization}.ejs) are PLACEHOLDERS:
 * a generic rendering of the whitelisted fields in English. The page content
 * is #1766, which replaces those templates; nothing else here needs to change.
 *
 * Output depends only on the row and the public base URL, and it does not
 * include `lastmod`, so a record whose only change is that hint renders the
 * same bytes and is not published again.
 *
 * Pure with respect to the database: loads without Sails when the base URL is
 * passed.
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const botPagePaths = require('../../utils/botPagePaths');

const VIEWS_DIR = path.join(__dirname, '../../../views/bot');
const DEFAULT_LANGUAGE = 'und';

// ejs resolves includes from `filename`; `cache` compiles each template once.
const renderTemplate = (name, data) => {
  const filename = path.join(VIEWS_DIR, `${name}.ejs`);
  return ejs.render(fs.readFileSync(filename, 'utf8'), data, {
    filename,
    cache: true,
  });
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

// The free-text `url` of an organization: only an http(s) address is a link
const safeHttpUrl = (value) => {
  if (typeof value !== 'string') return null;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:' ? value : null;
  } catch (e) {
    return null;
  }
};

// BCP 47 language tag from the record language (an ISO 639-3 code in the view)
const langOf = (language) =>
  typeof language === 'string' && /^[A-Za-z]{2,3}$/.test(language)
    ? language.toLowerCase()
    : DEFAULT_LANGUAGE;

const layout = (data, baseUrl) =>
  renderTemplate('layout', { ...data, siteUrl: baseUrl });

module.exports = {
  /**
   * @param {{entity_type: string, entity_id: number, language: string, page: object}} row
   *   a v_bot_page row
   * @param {{baseUrl?: string}} [options]
   * @returns {string} the HTML document
   */
  render(row, { baseUrl = publicBaseUrl() } = {}) {
    const bodyTemplate = BODY_TEMPLATES[row.entity_type];
    if (!bodyTemplate) {
      throw new RangeError(`Cannot render entity type ${row.entity_type}`);
    }
    const { page } = row;
    const lang = langOf(row.language || page.language);
    const body = renderTemplate(bodyTemplate, {
      page,
      lang,
      link: (type, id) => botPagePaths.toUrl(type, id, baseUrl),
      safeUrl: safeHttpUrl(page.url),
    });
    return layout(
      {
        lang,
        title: `${page.name} - Grottocenter`,
        canonicalUrl: botPagePaths.toUrl(
          row.entity_type,
          row.entity_id,
          baseUrl
        ),
        body,
      },
      baseUrl
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
