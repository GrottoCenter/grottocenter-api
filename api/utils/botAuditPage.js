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
 *                        JSON-LD `@id` values whose PATH is the SPA's
 *                        (`/ui/caves/12`), whatever the host, plus how many
 *                        of them are on another origin than `baseUrl` (a base
 *                        URL that changed). These are what the generator
 *                        emits. Left out: free text (a contributor can write
 *                        "/caves/12" in a description) and the links marked
 *                        rel="nofollow ugc", which a contributor typed (the
 *                        website of an organization).
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
const ID_KEY = '@id';
// Three scans of the page for tags, whose hrefs are UNIONED, because each fails
// on a case the others read:
//   - OPENING_TAG_RE treats a quote anywhere as a delimiter, so a raw `>` in
//     `title="a > b"` does not end the tag; with an unbalanced quote in an
//     unquoted value (`title=don't`, accepted by browsers) it fails to match or
//     swallows tags up to the next quote;
//   - SIMPLE_TAG_RE ends a tag at the first `>`: right for a stray quote, wrong
//     for a `>` in a value;
//   - VALUE_TAG_RE is how a browser reads it: a quote opens a value only right
//     after `=`, and a `=` not followed by a closed quote is a plain character.
//     It reads a tag that has both problems. Its alternatives are disjoint (the
//     lookahead keeps a `=` out of the last one when a quoted value follows),
//     so it cannot backtrack exponentially on a page that is not well formed.
// The union can only add a reference (a false positive deletes a page), never
// hide one. Tags without an href are dropped by hrefs().
const OPENING_TAG_RE = /<[a-z](?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const SIMPLE_TAG_RE = /<[a-z][^>]*>/gi;
const VALUE_TAG_RE =
  /<[a-z](?:=\s*"[^"]*"|=\s*'[^']*'|[^>=]|=(?!\s*(?:"[^"]*"|'[^']*')))*>/gi;
const NAME_VALUE_RE =
  /\s([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

// The attributes of a tag as { name: decoded value }, names in lower case
const attributesOf = (tag) => {
  const found = {};
  NAME_VALUE_RE.lastIndex = 0;
  let match = NAME_VALUE_RE.exec(tag);
  while (match) {
    const name = match[1].toLowerCase();
    // The first occurrence of an attribute is the one a browser uses
    if (!(name in found)) {
      found[name] = decodeEntities(match[2] ?? match[3] ?? match[4]);
    }
    match = NAME_VALUE_RE.exec(tag);
  }
  NAME_VALUE_RE.lastIndex = 0;
  return found;
};

// The `href` of every tag of the page, except the links a contributor wrote:
// the generator marks those rel="nofollow ugc" (the website of an
// organization is typed by a user and may well be an address of the SPA)
const hrefs = (html) => {
  const found = [];
  [OPENING_TAG_RE, SIMPLE_TAG_RE, VALUE_TAG_RE].forEach((tagRe) => {
    (html.match(tagRe) || []).forEach((tag) => {
      const { href, rel } = attributesOf(tag);
      if (href === undefined) return;
      if (/(^|\s)ugc(\s|$)/i.test(rel ?? '')) return;
      found.push(href);
    });
  });
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

/**
 * @param {string} html
 * @param {string} baseUrl the SPA's address, `https://grottocenter.org/ui`
 * @returns {{cave: number[], massif: number[], organization: number[], entrance: number[], foreign: number}}
 *   the distinct ids, sorted; and `foreign`, how many of the references are on
 *   another origin than `baseUrl`. A reference is matched on its PATH
 *   (`/ui/caves/12`), whatever the host: a page rendered under another base URL
 *   (the setting changed, http against https, www against the apex) still has
 *   its links checked, and `foreign` shows the mismatch in the run record
 *   instead of letting it pass unseen.
 */
const recordRefs = (html, baseUrl) => {
  const base = new URL(String(baseUrl).replace(/\/+$/, '/'));
  const spaPath = base.pathname.replace(/\/+$/, '');
  const refRe = new RegExp(
    `^${spaPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(caves|massifs|organizations|entrances)/([1-9][0-9]{0,9})(?:/.*)?$`
  );
  const found = { cave: [], massif: [], organization: [], entrance: [] };
  let foreign = 0;
  // Distinct values: the two scans of the tags can read the same href twice
  new Set([...hrefs(html), ...jsonLdIds(html)]).forEach((value) => {
    let url;
    try {
      url = new URL(value, base);
    } catch {
      return;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    const match = refRe.exec(url.pathname);
    if (!match) return;
    const id = Number(match[2]);
    if (id > MAX_ID) return;
    if (url.origin !== base.origin) foreign += 1;
    found[TYPE_BY_DIRECTORY[match[1]]].push(id);
  });
  Object.keys(TYPE_BY_DIRECTORY).forEach((directory) => {
    const type = TYPE_BY_DIRECTORY[directory];
    found[type] = [...new Set(found[type])].sort((a, b) => a - b);
  });
  return { ...found, foreign };
};

module.exports = { detectionText, recordRefs, decodeEntities };
