/**
 * Denormalized scalar sort key for ordering biblio (document) search results
 * by author. Typesense can't sort on the `authors.nickname` array field, so we
 * precompute the alphabetical-first author name (persons + organizations),
 * normalized (diacritics stripped, lowercased, whitespace collapsed) so byte
 * order matches human A->Z. Authorless docs get a key that sorts last.
 *
 * Limitations: not true bibliographic order (join tables have no author-order
 * column, so we use the smallest name, not the first-listed one); co-authors
 * don't tie-break; persons and orgs are pooled as plain strings; non-Latin
 * scripts aren't transliterated; sorting is code-point order, not locale-aware.
 * For true first-author order, add an ordinal column to the join tables and key
 * on the ranked-first name — schema and query wiring stay the same.
 */

/**
 * Ordering bucket, carried as the key's first character so it decides the
 * comparison before any name characters are read: ascending order puts every
 * authored document before every authorless one, whatever script the names use.
 *
 * A single high sentinel character cannot do this. Normalization deliberately
 * keeps non-ASCII letters (Cyrillic, CJK, astral-plane CJK extensions), and no
 * code point is the maximum in both orderings that matter here — Typesense
 * compares sort keys as UTF-8 bytes while JS compares UTF-16 code units, so any
 * `~`- or U+FFFF-style sentinel is overtaken by some legitimate name in at
 * least one of them. A bucket prefix is ordering-agnostic: '0' < '1' holds in
 * both.
 */
const AUTHORED_SORT_KEY_PREFIX = '0';
const EMPTY_AUTHORS_SORT_KEY = '1';

const stripDiacritics = (value) =>
  value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

const normalizeName = (name) =>
  stripDiacritics(String(name)).toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Compare by code point rather than by UTF-16 code unit, so the name we pick
 * here is the same one Typesense would rank first when it later orders the keys
 * as UTF-8 bytes (UTF-8 byte order is code-point order). Array#sort's default
 * comparator disagrees for astral-plane characters: it would rank a CJK
 * Extension B name below a U+FExx one.
 */
const compareByCodePoint = (a, b) => {
  const aPoints = [...a];
  const bPoints = [...b];
  const shared = Math.min(aPoints.length, bPoints.length);
  for (let i = 0; i < shared; i += 1) {
    const diff = aPoints[i].codePointAt(0) - bPoints[i].codePointAt(0);
    if (diff !== 0) return diff;
  }
  return aPoints.length - bPoints.length;
};

/**
 * @param {string[]} personNames person author names (t_caver.nickname)
 * @param {string[]} organizationNames organization author names (t_grotto main name)
 * @returns {string} the normalized alphabetical-first author name, bucket-
 *   prefixed, or the authorless key that sorts after all of them.
 */
const computeDocumentAuthorsSort = (
  personNames = [],
  organizationNames = []
) => {
  const candidates = [...personNames, ...organizationNames]
    .filter((n) => n != null)
    .map(normalizeName)
    .filter((n) => n.length > 0);
  if (candidates.length === 0) return EMPTY_AUTHORS_SORT_KEY;
  const first = candidates.reduce((smallest, candidate) =>
    compareByCodePoint(candidate, smallest) < 0 ? candidate : smallest
  );
  return AUTHORED_SORT_KEY_PREFIX + first;
};

module.exports = {
  AUTHORED_SORT_KEY_PREFIX,
  EMPTY_AUTHORS_SORT_KEY,
  computeDocumentAuthorsSort,
};
