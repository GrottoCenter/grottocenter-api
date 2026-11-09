/**
 * Denormalized scalar sort key for ordering biblio (document) search results
 * by author: the alphabetical-first author name (persons + organizations
 * pooled as plain strings). Authorless docs get a key that sorts last.
 *
 * Method and limitations are those of computeNameSortKey. For true
 * first-author order, add an ordinal column to the join tables and key on the
 * ranked-first name — schema and query wiring stay the same.
 */
const {
  NAMED_SORT_KEY_PREFIX,
  EMPTY_NAME_SORT_KEY,
  computeNameSortKey,
} = require('./computeNameSortKey');

/**
 * @param {string[]} personNames person author names (t_caver.nickname)
 * @param {string[]} organizationNames organization author names (t_grotto main name)
 * @returns {string} the normalized alphabetical-first author name, bucket-
 *   prefixed, or the authorless key that sorts after all of them.
 */
const computeDocumentAuthorsSort = (personNames = [], organizationNames = []) =>
  computeNameSortKey(personNames, organizationNames);

module.exports = {
  AUTHORED_SORT_KEY_PREFIX: NAMED_SORT_KEY_PREFIX,
  EMPTY_AUTHORS_SORT_KEY: EMPTY_NAME_SORT_KEY,
  computeDocumentAuthorsSort,
};
