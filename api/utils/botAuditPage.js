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
 *                                  flattened to `key: value` lines, one per
 *                                  value, so a JSON escape (°) cannot hide
 *                                  a coordinate and a labelled number keeps its
 *                                  label (a list of numbers, a GeoJSON pair, on
 *                                  one line). Not the JSON as written, which
 *                                  would join unrelated fields with quotes and
 *                                  commas into text that is nowhere on the page
 *                                  (`utm`, then a name, a city and a region).
 *                                  A script that is not JSON is read as text.
 *                                  The detector itself is untouched.
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
 *   scan(html)           the one pass both of them read from.
 *
 * The markup is read by ONE hand-written pass (`scan`), the way the HTML
 * specification's tokenizer reads it: a quote opens an attribute value only
 * right after `=`, a `>` inside a quoted value does not end the tag, an
 * apostrophe in an unquoted value is part of it, the first occurrence of an
 * attribute is the one that counts, and `<script>` and `<style>` hold raw text
 * up to their end tag. It is linear: every character is looked at a bounded
 * number of times, whatever the page, so a page that is not well formed (many
 * `<` and no `>`, quotes that never close) cannot take the audit's time, which a
 * synchronous regular expression would not let `BOT_AUDIT_TIME_BUDGET_MS`
 * interrupt. A tag or a script that is still open at the end of the page is
 * reported as `unreadable`: the generator never writes one, and the audit
 * fails such a page (`unreadable-markup`) rather than guess what it holds.
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

// Case-insensitive end tags of the raw text elements; the search starts at
// lastIndex, so each element costs the distance it spans, once
const SCRIPT_END_RE = /<\/script/gi;
const STYLE_END_RE = /<\/style/gi;
const WHITESPACE = /[\t\n\f\r ]/;

// `key: value` for each leaf of a parsed JSON document, one per line. A list of
// numbers is one line, so a pair written as an array ([6.5, 46.1]) stays a pair
const flatten = (value, key, lines) => {
  if (Array.isArray(value)) {
    if (value.length > 1 && value.every((item) => typeof item === 'number')) {
      lines.push(`${key}: ${value.join(', ')}`);
    } else {
      value.forEach((item) => flatten(item, key, lines));
    }
  } else if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => flatten(v, k, lines));
  } else if (value !== null && value !== undefined) {
    lines.push(`${key}: ${value}`);
  }
};

// The lines of a JSON script, or null when it is not JSON
const flattenedJson = (raw) => {
  try {
    const lines = [];
    flatten(JSON.parse(raw), '', lines);
    return lines.join('\n');
  } catch {
    return null;
  }
};

/**
 * Reads the attributes of a tag whose name ended at `from` (the character there
 * is whitespace, `/` or `>`). Returns where the tag ends (the index after `>`),
 * the attributes in order, and whether the page ended inside the tag.
 */
const readAttributes = (html, from) => {
  const n = html.length;
  const attributes = [];
  let i = from;
  for (;;) {
    while (i < n && (WHITESPACE.test(html[i]) || html[i] === '/')) i += 1;
    if (i >= n) return { end: n, attributes, unreadable: true };
    if (html[i] === '>') return { end: i + 1, attributes, unreadable: false };
    // The name: up to whitespace, `/`, `>` or `=` (a leading `=` is part of it)
    const nameStart = i;
    i += 1;
    while (
      i < n &&
      !WHITESPACE.test(html[i]) &&
      html[i] !== '/' &&
      html[i] !== '>' &&
      html[i] !== '='
    ) {
      i += 1;
    }
    const name = html.slice(nameStart, i).toLowerCase();
    while (i < n && WHITESPACE.test(html[i])) i += 1;
    let value = '';
    if (html[i] === '=') {
      i += 1;
      while (i < n && WHITESPACE.test(html[i])) i += 1;
      const quote = html[i];
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, i + 1);
        if (close === -1) {
          attributes.push([name, decodeEntities(html.slice(i + 1))]);
          return { end: n, attributes, unreadable: true };
        }
        value = html.slice(i + 1, close);
        i = close + 1;
      } else {
        const valueStart = i;
        while (i < n && !WHITESPACE.test(html[i]) && html[i] !== '>') i += 1;
        value = html.slice(valueStart, i);
      }
    }
    attributes.push([name, decodeEntities(value)]);
  }
};

const firstOf = (attributes, name) => {
  const found = attributes.find(([attribute]) => attribute === name);
  return found ? found[1] : undefined;
};

/**
 * One linear pass over a page.
 *
 * @param {string} html
 * @returns {{
 *   text: string,        the text of the page and the values of its attributes,
 *                        comments kept, <script> and <style> left out, entities
 *                        not decoded yet
 *   scripts: string[],   the content of every <script>
 *   hrefs: string[],     the href of every tag, except rel="nofollow ugc" ones
 *   unreadable: boolean  markup that cannot be trusted: a tag, a comment or a
 *                        script still open at the end, or a bogus comment
 * }}
 */
const scan = (html) => {
  const n = html.length;
  const text = [];
  const scripts = [];
  const links = [];
  let unreadable = false;
  let i = 0;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      text.push(html.slice(i));
      break;
    }
    text.push(html.slice(i, lt));
    const next = html[lt + 1];
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      text.push(`\n${html.slice(lt + 4, end === -1 ? n : end)}\n`);
      if (end === -1) unreadable = true;
      i = end === -1 ? n : end + 3;
    } else if (next !== undefined && /[a-zA-Z]/.test(next)) {
      let nameEnd = lt + 1;
      while (
        nameEnd < n &&
        !WHITESPACE.test(html[nameEnd]) &&
        html[nameEnd] !== '/' &&
        html[nameEnd] !== '>'
      ) {
        nameEnd += 1;
      }
      const name = html.slice(lt + 1, nameEnd).toLowerCase();
      const tag = readAttributes(html, nameEnd);
      if (tag.unreadable) unreadable = true;
      i = tag.end;
      if ((name === 'script' || name === 'style') && !tag.unreadable) {
        // Raw text up to the end tag, or to the end of the page
        const endRe = name === 'script' ? SCRIPT_END_RE : STYLE_END_RE;
        endRe.lastIndex = i;
        const found = endRe.exec(html);
        const contentEnd = found ? found.index : n;
        if (name === 'script') scripts.push(html.slice(i, contentEnd));
        text.push('\n');
        if (found) {
          const close = html.indexOf('>', found.index);
          if (close === -1) unreadable = true;
          i = close === -1 ? n : close + 1;
        } else {
          unreadable = true;
          i = n;
        }
      } else {
        const values = tag.attributes.map(([, value]) => value);
        text.push(` ${values.join(' ')} `);
        const href = firstOf(tag.attributes, 'href');
        const rel = firstOf(tag.attributes, 'rel');
        if (href !== undefined && !/(^|\s)ugc(\s|$)/i.test(rel ?? '')) {
          links.push(href);
        }
      }
    } else if (next === '/' && /[a-zA-Z]/.test(html[lt + 2] ?? '')) {
      // An end tag: read like a start tag (a `>` inside a quoted value does not
      // end it), nothing to keep
      let nameEnd = lt + 2;
      while (
        nameEnd < n &&
        !WHITESPACE.test(html[nameEnd]) &&
        html[nameEnd] !== '/' &&
        html[nameEnd] !== '>'
      ) {
        nameEnd += 1;
      }
      const tag = readAttributes(html, nameEnd);
      if (tag.unreadable) unreadable = true;
      text.push(' ');
      i = tag.end;
    } else if (next === '!' || next === '/' || next === '?') {
      // A doctype is fine. Anything else here is a "bogus comment" (`<!x>`,
      // `<?x?>`, `</ >`): a browser drops it up to the next `>`, which can be
      // the start of a real tag, and other readers disagree about it. The
      // generator never writes one: it is unreadable
      const close = html.indexOf('>', lt + 2);
      if (!/^<!doctype[\s>]/i.test(html.slice(lt, lt + 10))) unreadable = true;
      text.push(' ');
      if (close === -1) unreadable = true;
      i = close === -1 ? n : close + 1;
    } else {
      // A `<` that opens nothing is text
      text.push('<');
      i = lt + 1;
    }
  }
  return { text: text.join(''), scripts, hrefs: links, unreadable };
};

/**
 * @param {string} html
 * @returns {{ body: string, jsonLd: string }}
 */
const detectionText = (html) => {
  const page = scan(html);
  // JSON as its lines; anything else as the text it is
  const jsonLd = page.scripts.map((code) => {
    const lines = flattenedJson(code);
    return lines === null ? code : lines;
  });
  return {
    body: decodeEntities(page.text),
    jsonLd: jsonLd.map(decodeEntities).join('\n'),
  };
};

const TYPE_BY_DIRECTORY = Object.freeze({
  caves: 'cave',
  massifs: 'massif',
  organizations: 'organization',
  entrances: 'entrance',
});
const MAX_ID = 2147483647;
const ID_KEY = '@id';

// Every `@id` string of the JSON-LD blocks
const jsonLdIds = (scripts) => {
  const found = [];
  const walk = (value, key) => {
    if (Array.isArray(value)) value.forEach((item) => walk(item, key));
    else if (value !== null && typeof value === 'object') {
      Object.entries(value).forEach(([k, v]) => walk(v, k));
    } else if (key === ID_KEY && typeof value === 'string') found.push(value);
  };
  scripts.forEach((code) => {
    try {
      walk(JSON.parse(code), '');
    } catch {
      // Not JSON: no reference to read (the text is still checked for coordinates)
    }
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
  const page = scan(html);
  // Distinct values: a link can be written twice
  new Set([...page.hrefs, ...jsonLdIds(page.scripts)]).forEach((value) => {
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

module.exports = { detectionText, recordRefs, decodeEntities, scan };
