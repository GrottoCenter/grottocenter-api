/**
 * botAuditPage.js
 *
 * @description :: What the nightly audit (#1887) reads out of a published page,
 *   independently of how the page was built. Pure: loads without Sails.
 *
 *   detectionText(html)  the text the coordinate detector (#1761) is run over,
 *                        in two parts:
 *                          body    what a crawler reads: the text of the page,
 *                                  the value of every attribute (the description
 *                                  and Open Graph meta tags, titles) and the
 *                                  comments, with the markup and the entities
 *                                  decoded (`&#39;` is the minute mark of
 *                                  46°06&#39;08&quot;). The <style> blocks are
 *                                  dropped (CSS is not content);
 *                          jsonLd  every JSON-LD block (and any other script),
 *                                  as written AND flattened to `key: value`
 *                                  lines, so a JSON escape (°) cannot hide
 *                                  a coordinate and a labelled number keeps its
 *                                  label. The detector itself is untouched.
 *   recordRefs(html, baseUrl)
 *                        the cave, massif, organization and entrance ids the
 *                        page links to or carries: the `href` values and the
 *                        JSON-LD `@id` values that point at the SPA's own
 *                        address (`baseUrl`, or its path alone), which are
 *                        what the generator emits. Free text is left out: a
 *                        contributor can write "/caves/12", or a link to
 *                        another site, in a description, and that is not a
 *                        reference of the page.
 */

const NAMED_ENTITIES = Object.freeze({
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  deg: '°',
  ordm: 'º',
  prime: '′',
  Prime: '″',
});

const decodeEntities = (text) =>
  text.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,8});/gi, (whole, name) => {
    if (name[0] === '#') {
      const code =
        name[1].toLowerCase() === 'x'
          ? parseInt(name.slice(2), 16)
          : parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name)
      ? NAMED_ENTITIES[name]
      : whole;
  });

// A closing tag is `</script` followed by anything up to `>` (`</script\t\n bar>`
// closes a script for a browser)
const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script[^>]*>/gi;
const STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style[^>]*>/gi;
const COMMENT_RE = /<!--([\s\S]*?)-->/g;
const TAG_RE = /<[a-z!/?][^>]*>/gi;
const ATTRIBUTE_RE = /\s[^\s=/>]+\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

// `key: value` for each leaf of a parsed JSON document, one per line
const flatten = (value, key, lines) => {
  if (Array.isArray(value)) {
    value.forEach((item) => flatten(item, key, lines));
  } else if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => flatten(v, k, lines));
  } else if (value !== null && value !== undefined) {
    lines.push(`${key}: ${value}`);
  }
};

const flattenedJson = (raw) => {
  try {
    const lines = [];
    flatten(JSON.parse(raw), '', lines);
    return lines.join('\n');
  } catch {
    // Not JSON: the raw text is checked anyway
    return '';
  }
};

// The text of a tag: a space, then the values of its attributes
const tagText = (tag) => {
  const values = [];
  let match = ATTRIBUTE_RE.exec(tag);
  while (match) {
    values.push(match[1] ?? match[2] ?? match[3]);
    match = ATTRIBUTE_RE.exec(tag);
  }
  ATTRIBUTE_RE.lastIndex = 0;
  return ` ${values.join(' ')} `;
};

/**
 * @param {string} html
 * @returns {{ body: string, jsonLd: string }}
 */
const detectionText = (html) => {
  const scripts = [];
  const withoutScripts = html.replace(SCRIPT_RE, (whole, attributes, code) => {
    scripts.push(code);
    scripts.push(flattenedJson(code));
    return '\n';
  });
  const body = decodeEntities(
    withoutScripts
      .replace(STYLE_RE, '\n')
      .replace(COMMENT_RE, '\n$1\n')
      .replace(TAG_RE, tagText)
  );
  return { body, jsonLd: scripts.map(decodeEntities).join('\n') };
};

const TYPE_BY_DIRECTORY = Object.freeze({
  caves: 'cave',
  massifs: 'massif',
  organizations: 'organization',
  entrances: 'entrance',
});
const MAX_ID = 2147483647;
const HREF_RE = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
const ID_KEY = '@id';

// Every `href` value of the page's tags, entities decoded
const hrefs = (html) => {
  const found = [];
  let match = HREF_RE.exec(html);
  while (match) {
    found.push(decodeEntities(match[1] ?? match[2] ?? match[3]));
    match = HREF_RE.exec(html);
  }
  HREF_RE.lastIndex = 0;
  return found;
};

// Every `@id` string of the JSON-LD blocks
const jsonLdIds = (html) => {
  const found = [];
  const walk = (value, key) => {
    if (Array.isArray(value)) value.forEach((item) => walk(item, key));
    else if (value !== null && typeof value === 'object') {
      Object.entries(value).forEach(([k, v]) => walk(v, k));
    } else if (key === ID_KEY && typeof value === 'string') found.push(value);
  };
  html.replace(SCRIPT_RE, (whole, attributes, code) => {
    try {
      walk(JSON.parse(code), '');
    } catch {
      // Not JSON: no reference to read (the text is still checked for coordinates)
    }
    return whole;
  });
  return found;
};

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {string} html
 * @param {string} baseUrl the SPA's address, `https://grottocenter.org/ui`
 * @returns {{cave: number[], massif: number[], organization: number[], entrance: number[]}}
 *   the distinct ids, sorted
 */
const recordRefs = (html, baseUrl) => {
  const base = String(baseUrl).replace(/\/+$/, '');
  const path = new URL(base).pathname.replace(/\/+$/, '');
  // The absolute address, or the same path alone
  const prefixes = [base, path].filter(Boolean).map(escapeRegExp).join('|');
  const refRe = new RegExp(
    `^(?:${prefixes})/(caves|massifs|organizations|entrances)/([1-9][0-9]{0,9})(?:[/?#].*)?$`
  );
  const found = { cave: [], massif: [], organization: [], entrance: [] };
  [...hrefs(html), ...jsonLdIds(html)].forEach((url) => {
    const match = refRe.exec(url);
    if (!match) return;
    const id = Number(match[2]);
    if (id <= MAX_ID) found[TYPE_BY_DIRECTORY[match[1]]].push(id);
  });
  Object.keys(found).forEach((type) => {
    found[type] = [...new Set(found[type])].sort((a, b) => a - b);
  });
  return found;
};

module.exports = { detectionText, recordRefs, decodeEntities };
