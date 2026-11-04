/**
 * Pieces shared by the page models (botPageModel.js for the records,
 * botHubModel.js for the hubs): the title, the language tag, the meta
 * description, the facts of the figures, the clean name of a region.
 *
 * Pure: loads without Sails.
 */

const BRAND = 'Grottocenter';
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

// BCP 47 language tag of a record language, an ISO 639-3 code in the view:
// the ISO 639-1 subtag when the language has one (`fra` -> `fr`), as BCP 47
// requires, else the 3-letter code, which the IANA registry holds for the
// languages without a 2-letter one. `tags` maps a 3-letter code to its 2-letter
// one (t_language.part1, see loadLanguageTags).
const langOf = (language, tags) => {
  if (typeof language !== 'string' || !/^[A-Za-z]{2,3}$/.test(language)) {
    return null;
  }
  const code = language.toLowerCase();
  return tags.get(code) || code;
};

// Cuts to `max` characters (code points, never half a surrogate pair)
const truncate = (text, max) => {
  const chars = Array.from(text);
  if (chars.length <= max) return text;
  return `${chars
    .slice(0, max - 1)
    .join('')
    .trimEnd()}…`;
};

/**
 * `<name> - Grottocenter`, at most 60 characters: a longer name is cut and
 * ends with an ellipsis, and the brand suffix is kept.
 */
const buildTitle = (name) => {
  const suffix = ` - ${BRAND}`;
  const trimmed = (name || '').trim();
  if (trimmed === '') return BRAND;
  return `${truncate(trimmed, TITLE_MAX - Array.from(suffix).length)}${suffix}`;
};

const isKnown = (value) =>
  value !== null && value !== undefined && value !== '';
// 0 means unknown for a depth or a length
const positive = (value) =>
  typeof value === 'number' && value > 0 ? value : null;

// The name of a country is t_country.native_name, whatever the page language
// (#1939 retires the translated columns); an unknown code is shown as is
const countryNameOf = (code, countryNames) => {
  if (!isKnown(code)) return null;
  return countryNames.get(String(code).toUpperCase()) || String(code);
};

const buildMetaDescription = (parts) =>
  truncate(parts.filter(isKnown).join(' '), DESCRIPTION_MAX);

const sentence = (text) => (isKnown(text) ? `${text}.` : null);

/**
 * The name of a region as the pages show it: t_iso3166_2.name without its
 * `[bracketed alternatives]` and without a trailing `*` ("Carmarthenshire
 * [Sir Gaerfyrddin GB-GFY]" -> "Carmarthenshire", "Nafarroa*" -> "Nafarroa").
 * The same rule is in sql/9_34_2026_11_04_v_bot_hub.sql, which gates the hubs
 * on it; a test compares the two. Null when nothing is left.
 */
const cleanRegionName = (name) => {
  if (typeof name !== 'string') return null;
  const cleaned = name
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\*+$/, '')
    .trim();
  return cleaned === '' ? null : cleaned;
};

/**
 * Sorts names the way a reader expects, in every runtime: accents and case are
 * ignored, then the code points decide. No ICU collation, whose result can
 * change with the Node version and would move a page's bytes.
 */
const sortKey = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const byName = (a, b) => {
  const ka = sortKey(a.text);
  const kb = sortKey(b.text);
  if (ka !== kb) return ka < kb ? -1 : 1;
  if (a.text !== b.text) return a.text < b.text ? -1 : 1;
  return 0;
};

/**
 * The figures of a hub or a massif as label/value pairs, in a fixed order;
 * a figure that is null (no data) is left out. None at all when the statistics
 * count no cave: the hub or the massif has published caves, so a count of 0 is a
 * view that has not been refreshed since, not a fact to print.
 *
 * @param {object} figures what the whitelist lets through of `figures`
 * @param {object} labels the labels of the page language
 */
const figureFacts = (figures, labels) => {
  if (!figures || figures.nbCaves === 0) return [];
  const count = (label, value) =>
    typeof value === 'number' ? [label, String(value)] : null;
  const metres = (label, value) =>
    typeof value === 'number' ? [label, `${value} m`] : null;
  return [
    count(labels.cavesCount, figures.nbCaves),
    count(labels.networks, figures.nbNetworks),
    count(labels.massifs, figures.nbMassifs),
    count(labels.divingCave, figures.nbDivingCaves),
    metres(labels.length, figures.totalLength),
    metres(labels.avgDepth, figures.avgDepth),
    metres(labels.avgLength, figures.avgLength),
  ]
    .filter(Boolean)
    .map(([label, value]) => ({ label, value }));
};

module.exports = {
  BRAND,
  TITLE_MAX,
  DESCRIPTION_MAX,
  langOf,
  truncate,
  buildTitle,
  isKnown,
  positive,
  countryNameOf,
  buildMetaDescription,
  sentence,
  cleanRegionName,
  sortKey,
  byName,
  figureFacts,
};
