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

module.exports = {
  DOCUMENT_TYPE_IDS,
  TYPES_ALLOWING_ISSUE,
};
