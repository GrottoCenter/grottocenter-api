const crypto = require('crypto');

/**
 * Detects coordinates written in free text.
 *
 * Contributors sometimes write a position into prose ("Coordonnées Lambert II
 * Centre (km) : X= 943,37 Y= 132,12"). Leaving the latitude and longitude
 * columns out of a published page does not stop that text from leaking, so the
 * static pages run every free-text body through `detect` and withhold the ones
 * that match.
 *
 * The function is pure: no database, filesystem, network, clock or locale
 * access, and no state kept between calls. The same text always gives the same
 * answer. It is deliberately conservative. A false positive withholds one text
 * until a moderator edits it, a false negative publishes a position, so every
 * ambiguous notation is treated as a match.
 *
 * Each family matches with `.` or `,` as the decimal separator. Every
 * quantifier is bounded so that no input can make the engine backtrack
 * catastrophically.
 *
 * Changing a pattern changes the verdicts already stored for every text, so a
 * change must come with a new PATTERN_SET_VERSION: the stored verdicts are
 * re-computed when the version moves. A test pins the fingerprint of the
 * pattern set to its version and fails when they drift apart.
 */

// 1 for the first release of the pattern set. Bump it with any change to PATTERNS.
const PATTERN_SET_VERSION = 1;

// Between two numbers: whitespace, or a comma, semicolon or slash with optional whitespace.
const SEP = '(?:\\s{1,3}|\\s{0,3}[;,/]\\s{0,3})';

// The order is part of the pattern set: the first family that matches names the match.
const PATTERNS = Object.freeze(
  [
    {
      // 46°06'08"N, 46° 06' 08'', 46°06.133', 43° 12,5 N (minutes without a mark)
      id: 'dms',
      re: /\d{1,3}\s{0,3}°\s{0,3}\d{1,2}(?:[.,]\d{1,6})?\s{0,3}(?:['′’]|[NSEWO]\b)/,
    },
    {
      // N 46.10222 E 6.51234, N46.10222, E6.51234, S 34.4512 W 85.1234. Ahead of
      // degrees-hemisphere: a position has a second number after the east/west
      // letter, which tells it from a bearing ("N120°E", "S 30° W").
      id: 'hemisphere-prefix',
      re: /\b[NS]\s{0,2}\d{1,3}(?:[.,]\d{1,8})?\s{0,3}°?\s{0,3}[,;/]?\s{0,3}[EWO]\s{0,2}\d{1,3}/,
    },
    {
      // 54.183628°N 2.487239°W, 45° N, 46,10222 N, 46.10222° Nord, 45.5° North.
      // A standalone capital N or S before the number ("orientée N120°E") is a
      // compass bearing, not a position. The spelled-out hemispheres are
      // case-sensitive: lowercase "est" is the French verb ("45° est visible").
      id: 'degrees-hemisphere',
      re: /(?<!\b[NS]\s{0,2})(?<![\d.,])(?:\d{1,3}(?:[.,]\d{1,8})?\s{0,3}°|\d{1,3}[.,]\d{3,8})\s{0,3}(?:[NSEWO]|Nord|Sud|Est|Ouest|North|South|East|West)\b/,
    },
    {
      // 46.10222, 6.51 / 46,10222 ; 6,51 / 46.102 6.510 / -34.4512 -85.1234
      id: 'decimal-pair',
      re: new RegExp(
        `-?\\d{1,3}[.,]\\d{4,8}${SEP}-?\\d{1,3}[.,]\\d{1,8}|-?\\d{1,3}[.,]\\d{1,8}${SEP}-?\\d{1,3}[.,]\\d{4,8}|-?\\d{1,3}[.,]\\d{3}${SEP}-?\\d{1,3}[.,]\\d{3}`
      ),
    },
    {
      // X= 943,37 Y= 132,12 / x=943.37 y=132.12 / X : 943370 Y : 2132120
      id: 'lambert-xy',
      re: /\b[Xx]\s{0,3}[=:]\s{0,3}\d{2,7}(?:[.,]\d{1,3})?[^\n]{0,60}?\b[Yy]\s{0,3}[=:]\s{0,3}\d{2,7}(?:[.,]\d{1,3})?/,
    },
    {
      // Lambert II Centre, Lambert IIe, Lambert 93, Lambert zone III, Lambert 2 étendu.
      // A bare "Lambert 2" stays out: it is also a cave name.
      id: 'lambert-label',
      re: /\blambert\s{0,3}(?:(?:I{1,3}|IV|93|zone)e?\b|[1-4]\s{0,3}(?:e|é|[eé]tendu)\b)/i,
    },
    {
      // 32T 340000 5105000, UTM 32 340000 5105000
      id: 'utm',
      re: /\b\d{1,2}\s{0,2}[C-HJ-NP-X]\s{1,3}\d{5,7}\s{1,3}\d{6,8}\b|\bUTM\b[^\n]{0,40}?\d{5}/i,
    },
    {
      // NGR SD 6830 7654, SD 6830 7654, SD683765
      id: 'ngr',
      re: /\bNGR\b|\b[A-HJ-Z][A-HJ-Z]\s{0,2}(?:\d{3}\s{0,2}\d{3}|\d{4}\s{0,2}\d{4}|\d{5}\s{0,2}\d{5})\b/,
    },
    {
      // Coordonnées : 46.1, Latitude 46.1, GPS: 46, Lat = 46, Coordonnées GPS : N 46.1
      id: 'labelled-coordinates',
      re: /\b(?:latitude|longitude|coordonn[ée]es?|coordinates?|gps)\b[^\d\n]{0,20}?-?\d|\b(?:lat|lon|lng)\.?\s{0,3}[:=]\s{0,3}-?\d/i,
    },
    {
      // Nord : 4510.123, East: 340000. Case-sensitive on purpose: lowercase "est" is the
      // French verb ("est = 25x30x10 m"), only the capitalised "Est" names an axis.
      id: 'labelled-axis',
      re: /\b(?:[Nn]ord|[Nn]orth|[Ee]ast|Est|EST)\b\s{0,3}[:=]\s{0,3}\d{3}/,
    },
  ].map((p) => Object.freeze(p))
);

const PATTERN_IDS = Object.freeze(PATTERNS.map((p) => p.id));

/**
 * SHA-256 of the identifiers, flags and sources of the pattern set, in order.
 * Pinned to PATTERN_SET_VERSION by a test.
 */
const PATTERN_SET_FINGERPRINT = crypto
  .createHash('sha256')
  .update(
    PATTERNS.map((p) => `${p.id}\n${p.re.flags}\n${p.re.source}`).join('\n\n')
  )
  .digest('hex');

const NO_MATCH = Object.freeze({ matched: false });

// Longest excerpt returned for a match, which is enough for a moderator to see why.
const MAX_MATCH_LENGTH = 80;

/**
 * @param {string | null | undefined} text a free-text body, null and undefined count as empty
 * @returns {{ matched: false } | { matched: true, patternId: string, match: string }}
 *   `match` is the matched substring and holds the coordinates: store it for
 *   moderators, never publish it.
 * @throws {TypeError} when `text` is neither a string, null nor undefined. The
 *   caller treats a throw as a match (fail closed).
 */
const detect = (text) => {
  if (text === undefined || text === null) return NO_MATCH;
  if (typeof text !== 'string') {
    throw new TypeError(
      'coordinateDetector.detect expects a string, null or undefined'
    );
  }
  // º (masculine ordinal) and ˚ (ring above) are typed as degree signs, and NFKC
  // would turn them into "o" and a space. Map them first, then let NFKC fold
  // full-width digits, non-breaking and thin spaces ("943 370") into plain forms.
  const normalized = text.replace(/[º˚]/g, '°').normalize('NFKC');
  for (const { id, re } of PATTERNS) {
    const found = re.exec(normalized);
    if (found) {
      return {
        matched: true,
        patternId: id,
        match: found[0].slice(0, MAX_MATCH_LENGTH),
      };
    }
  }
  return NO_MATCH;
};

module.exports = {
  detect,
  PATTERN_SET_VERSION,
  PATTERN_SET_FINGERPRINT,
  PATTERN_IDS,
};
