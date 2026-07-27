/**
 * Denormalized scalar sort key for ordering biblio (document) search results
 * by author. Typesense can't sort on the `authors.nickname` array field, so we
 * precompute the alphabetical-first author name (persons + organizations),
 * normalized (diacritics stripped, lowercased, whitespace collapsed) so byte
 * order matches human A->Z. Authorless docs get a sentinel that sorts last.
 *
 * Limitations: not true bibliographic order (join tables have no author-order
 * column, so we use the smallest name, not the first-listed one); co-authors
 * don't tie-break; persons and orgs are pooled as plain strings; non-Latin
 * scripts aren't transliterated; sorting is code-point order, not locale-aware.
 * For true first-author order, add an ordinal column to the join tables and key
 * on the ranked-first name — schema and query wiring stay the same.
 */

// Sentinel sorts after any normalized name (a-z). Ensures authorless
// documents land at the bottom on ascending sort instead of the top.
const EMPTY_AUTHORS_SORT_KEY = '~';

const stripDiacritics = (value) =>
  value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

const normalizeName = (name) =>
  stripDiacritics(String(name)).toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * @param {string[]} personNames person author names (t_caver.nickname)
 * @param {string[]} organizationNames organization author names (t_grotto main name)
 * @returns {string} the normalized alphabetical-first author name, or a
 *   sentinel that sorts last when there is no author.
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
  return candidates.sort()[0];
};

module.exports = {
  EMPTY_AUTHORS_SORT_KEY,
  computeDocumentAuthorsSort,
};
