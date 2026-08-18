/**
 * Document type constants.
 *
 * IDs correspond to the t_type table (seeded in sql/2_2021_09_26_1_doc_types.sql).
 */

const DOCUMENT_TYPE_IDS = {
  BOOK: 16,
  ISSUE: 17,
  ARTICLE: 18,
};

// Document types whose DB column `issue` may be non-NULL.
// Matches the t_document_check constraint in sql/0_tables.sql.
const TYPES_ALLOWING_ISSUE = [DOCUMENT_TYPE_IDS.BOOK, DOCUMENT_TYPE_IDS.ISSUE];

// Document types that may have a parent document set.
// An Issue must be under a Collection; an Article must be under an Issue.
// All other types are top-level and must not have a parent.
const TYPES_ALLOWING_PARENT = [
  DOCUMENT_TYPE_IDS.ISSUE,
  DOCUMENT_TYPE_IDS.ARTICLE,
];

// Document types for which a parent is mandatory at creation time.
const TYPES_REQUIRING_PARENT = [
  DOCUMENT_TYPE_IDS.ISSUE,
  DOCUMENT_TYPE_IDS.ARTICLE,
];

/**
 * The seven many-to-many associations on TDocument that must be managed via
 * `replaceCollection()`. Waterline silently ignores collection fields when they
 * are passed to `.update()/.set()`, so every write path that touches any of
 * these fields must strip them from the scalar payload and call
 * `TDocument.replaceCollection(id, field).members([...])` separately.
 *
 * Empty-array semantics: passing `[]` to `.members()` intentionally clears the
 * collection. `undefined` (field absent from request) means "leave untouched".
 *
 * FormData note: multipart/form-data cannot express an empty array natively.
 * The front-end sends the literal string `'[]'` to signal an intentional clear.
 * `DocumentService.getConvertedDataFromClient` converts `'[]'` → `[]` before
 * data reaches the controllers.
 */
const DOCUMENT_M2M_COLLECTIONS = [
  'authors',
  'authorsOrganization',
  'subjects',
  'languages',
  'massifs',
  'isoRegions',
  'countries',
];

module.exports = {
  DOCUMENT_TYPE_IDS,
  TYPES_ALLOWING_ISSUE,
  TYPES_ALLOWING_PARENT,
  TYPES_REQUIRING_PARENT,
  DOCUMENT_M2M_COLLECTIONS,
};
