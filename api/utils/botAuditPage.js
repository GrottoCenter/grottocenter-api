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
 *   recordRefs(html)     the cave, massif, organization and entrance ids the
 *                        page links to or carries (`/ui/caves/12`, a JSON-LD
 *                        `@id`).
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

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
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

const REF_RE =
  /\/(caves|massifs|organizations|entrances)\/([1-9][0-9]{0,9})(?![0-9])/g;
const TYPE_BY_DIRECTORY = Object.freeze({
  caves: 'cave',
  massifs: 'massif',
  organizations: 'organization',
  entrances: 'entrance',
});
const MAX_ID = 2147483647;

/**
 * @param {string} html
 * @returns {{cave: number[], massif: number[], organization: number[], entrance: number[]}}
 *   the distinct ids, sorted
 */
const recordRefs = (html) => {
  const found = { cave: [], massif: [], organization: [], entrance: [] };
  const text = decodeEntities(html);
  let match = REF_RE.exec(text);
  while (match) {
    const id = Number(match[2]);
    if (id <= MAX_ID) found[TYPE_BY_DIRECTORY[match[1]]].push(id);
    match = REF_RE.exec(text);
  }
  REF_RE.lastIndex = 0;
  Object.keys(found).forEach((type) => {
    found[type] = [...new Set(found[type])].sort((a, b) => a - b);
  });
  return found;
};

module.exports = { detectionText, recordRefs, decodeEntities };
