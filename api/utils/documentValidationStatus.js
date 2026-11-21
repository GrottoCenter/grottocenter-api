const {
  DOCUMENT_VALIDATION_STATUS,
} = require('../../config/constants/document');

/**
 * Whether a document was accepted before its pending modification, as far as
 * the row alone can tell: the flag DocumentService.updateDocument stores in
 * modifiedDocJson, or the row's own isValidated without a pending
 * modification. Undefined for a snapshot stored before the flag existed, where
 * only the document history can tell (see
 * DocumentService.wasValidatedBeforeModification).
 * @param {Object} document a t_document row
 * @returns {boolean|undefined}
 */
const wasValidatedFromRow = (document) => {
  if (!document.modifiedDocJson) return document.isValidated === true;
  const { wasValidated } = document.modifiedDocJson;
  return typeof wasValidated === 'boolean' ? wasValidated : undefined;
};

/**
 * Whether the status of a document depends on its history: an unvalidated,
 * undecided row whose pending modification predates the wasValidated flag.
 * @param {Object} document a t_document row
 * @returns {boolean}
 */
const needsHistoryFallback = (document) =>
  document.isValidated === false &&
  document.dateValidation == null &&
  document.modifiedDocJson != null &&
  wasValidatedFromRow(document) === undefined;

/**
 * The validationStatus of a document (#2005), from server-owned data only:
 * - isValidated: `validated`;
 * - unvalidated with a decision date: `rejected` (a refused modification of an
 *   accepted document restores isValidated, so it stays `validated`);
 * - otherwise `modificationPending` when the document was accepted before its
 *   pending modification, `pending` when it never was. The validator is no
 *   proof of a previous acceptance: a refused submission corrected and
 *   resubmitted keeps it, and is `pending`.
 *
 * Undefined when the source cannot tell: isValidated, dateValidation or
 * modifiedDocJson not selected, or a legacy snapshot without
 * `hasValidatedHistory`.
 * @param {Object} document a t_document row
 * @param {Object} [options]
 * @param {boolean} [options.hasValidatedHistory] whether h_document holds an
 *   accepted version of the document, for a legacy snapshot
 * @returns {string|undefined} a DOCUMENT_VALIDATION_STATUS value
 */
const resolveDocumentValidationStatus = (
  document,
  { hasValidatedHistory } = {}
) => {
  if (!document || typeof document.isValidated !== 'boolean') return undefined;
  if (document.isValidated) return DOCUMENT_VALIDATION_STATUS.VALIDATED;
  if (document.dateValidation === undefined) return undefined;
  if (document.dateValidation !== null) {
    return DOCUMENT_VALIDATION_STATUS.REJECTED;
  }
  if (document.modifiedDocJson === undefined) return undefined;
  const wasValidated = wasValidatedFromRow(document) ?? hasValidatedHistory;
  if (typeof wasValidated !== 'boolean') return undefined;
  return wasValidated
    ? DOCUMENT_VALIDATION_STATUS.MODIFICATION_PENDING
    : DOCUMENT_VALIDATION_STATUS.PENDING;
};

/**
 * The validationStatus of a historical version of a document, which holds no
 * modifiedDocJson: an unvalidated, undecided version is a pending
 * modification when an earlier version was accepted.
 * @param {Object} snapshot an h_document row
 * @param {boolean} hasEarlierValidatedVersion
 * @returns {string|undefined}
 */
const resolveSnapshotValidationStatus = (
  snapshot,
  hasEarlierValidatedVersion
) =>
  resolveDocumentValidationStatus(
    {
      isValidated: snapshot.isValidated,
      dateValidation: snapshot.dateValidation,
      modifiedDocJson: {},
    },
    { hasValidatedHistory: hasEarlierValidatedVersion === true }
  );

module.exports = {
  needsHistoryFallback,
  resolveDocumentValidationStatus,
  resolveSnapshotValidationStatus,
  wasValidatedFromRow,
};
