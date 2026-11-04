/**
 * Pieces shared by the page models (botPageModel.js for the records,
 * botHubModel.js for the hubs): the title, the language tag, the meta
 * description, the figures, the clean name of a region, the wording of a count.
 *
 * Pure: loads without Sails.
 */

const BRAND = 'Grottocenter';

// `{count, plural, one {cave} other {caves}}`, the ICU form the front uses for
// some of its strings; anything else is a plain text
const PLURAL_MESSAGE =
  /^\{count, plural,((?:\s*(?:=\d+|zero|one|two|few|many|other)\s*\{[^{}]*\})+)\s*\}$/;
const PLURAL_BRANCH = /(=\d+|zero|one|two|few|many|other)\s*\{([^{}]*)\}/g;

/**
 * The text of a label for a count: the branch of an ICU plural message that
 * the language's plural rules pick (`=<n>` first, then the CLDR category, then
 * `other`), `#` replaced by the count; a plain label as it is.
 *
 * @param {string} message a label of botLabels
 * @param {number} count
 * @param {string} lang the BCP 47 tag of the page
 */
const pluralText = (message, count, lang) => {
  const match = PLURAL_MESSAGE.exec(message);
  if (!match) return message;
  const branches = new Map(
    Array.from(match[1].matchAll(PLURAL_BRANCH), ([, key, text]) => [key, text])
  );
  let category = 'other';
  try {
    category = new Intl.PluralRules(lang).select(count);
  } catch (e) {
    // An unknown tag: the default rules
  }
  const text =
    branches.get(`=${count}`) ??
    branches.get(category) ??
    branches.get('other');
  return (text ?? message).replace(/#/g, String(count));
};

// The first letter in upper case, for a label used as a heading
const capitalize = (text) =>
  typeof text === 'string' && text !== ''
    ? `${text.charAt(0).toUpperCase()}${text.slice(1)}`
    : text;

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
 * The figures of a hub or a massif, in a fixed order, as the SPA's statistics
 * widget shows them: the number, then the text of the front's string for it
 * (`8` / `cavités permettent de faire de la plongée`). A figure that is null
 * (no data) is left out. None at all when the statistics count no cave: the
 * hub or the massif has published caves, so a count of 0 is a view that has
 * not been refreshed since, not a fact to print.
 *
 * @param {object} figures what the whitelist lets through of `figures`
 * @param {object} labels the labels of the page language
 * @param {string} lang the language the labels are in (labelsLanguage), whose
 *   plural rules apply: not the page language when the labels fell back to English
 * @returns {Array<{value: string, text: string}>}
 */
const figureLines = (figures, labels, lang) => {
  if (!figures || figures.nbCaves === 0) return [];
  const count = (label, value) =>
    typeof value === 'number'
      ? { value: String(value), text: pluralText(label, value, lang) }
      : null;
  const metres = (label, value) =>
    typeof value === 'number' ? { value: `${value} m`, text: label } : null;
  return [
    count(labels.figureCaves, figures.nbCaves),
    count(labels.figureNetworks, figures.nbNetworks),
    // The SPA's choice: the singular up to 1, the plural above
    typeof figures.nbMassifs === 'number'
      ? count(
          figures.nbMassifs > 1 ? labels.figureMassifs : labels.figureMassif,
          figures.nbMassifs
        )
      : null,
    count(labels.figureDivingCaves, figures.nbDivingCaves),
    metres(labels.figureTotalLength, figures.totalLength),
    metres(labels.avgDepth, figures.avgDepth),
    metres(labels.avgLength, figures.avgLength),
  ].filter(Boolean);
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
  figureLines,
  pluralText,
  capitalize,
};
