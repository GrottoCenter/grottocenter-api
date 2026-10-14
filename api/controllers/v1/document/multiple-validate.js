const CommonService = require('../../../services/CommonService');
const DocumentService = require('../../../services/DocumentService');
const FileService = require('../../../services/FileService');
const RightService = require('../../../services/RightService');
const NotificationService = require('../../../services/NotificationService');
const isValidId = require('../../../utils/isValidId');
const parseBool = require('../../../utils/parseBool');
const readBoolParam = require('../../../utils/readBoolParam');
const {
  DOCUMENT_M2M_COLLECTIONS,
} = require('../../../../config/constants/document');

const validatedFields = (validationComment, validationAuthor) => ({
  isValidated: true,
  modifiedDocJson: null,
  dateValidation: new Date(),
  validationComment,
  validator: validationAuthor,
});

async function markDocumentValidated(
  documentId,
  validationComment,
  validationAuthor
) {
  await TDocument.updateOne(documentId).set(
    validatedFields(validationComment, validationAuthor)
  );
}

// Rejecting a pending change also sets isValidated back to true, the same write
// as accepting a new submission, so the change_document() trigger cannot tell
// the two apart and would log the rejection as a change (#1781): an 'update'
// credited to the last reviewer, or a 'create' of a refused submission.
// app.document_skip_log makes the trigger skip it. SET LOCAL scopes the flag to
// this transaction, so it reverts when the transaction ends.
async function markDocumentRejected(
  documentId,
  validationComment,
  validationAuthor
) {
  await sails.getDatastore().transaction(async (db) => {
    await CommonService.query(
      `SET LOCAL app.document_skip_log TO 'true'`,
      [],
      db
    );
    await TDocument.updateOne(documentId)
      .set(validatedFields(validationComment, validationAuthor))
      .usingConnection(db);
  });
}

// The seven m2m associations on TDocument that must be handled via replaceCollection.
// Waterline silently ignores collection fields passed to .update()/.set().
// Defined in config/constants/document.js — single source of truth.

// t_document.validation_comment is varchar(300) (sql/0_tables.sql), and Waterline
// rejects a longer value outright, so the auto-rejection reason is truncated to
// fit rather than trading one failure for another. The untruncated reason always
// goes to the log.
const VALIDATION_COMMENT_MAX_LENGTH = 300;

// resolveM2MMembers has to run before the write transaction opens, so a target
// row can be deleted in between and the insert still fail with 23503. The
// transaction rolls back in full, so re-resolving and re-applying is safe and
// reaches the outcome the first pass would have reached had it seen the delete.
// Two attempts: one to lose the race, one to act on what it learned.
const MAX_APPLY_ATTEMPTS = 2;

// Refuse a pending modification that can no longer be applied to the current
// database state. The document returns to its last validated state and the
// reason is recorded so the author and moderator can see why.
//
// isValidated must be restored to true, matching the manual-rejection path:
// both go through markDocumentRejected. Submitting a modification sets isValidated false and
// dateValidation null (DocumentService.updateDocument); rejecting it sets
// dateValidation but leaves the flag false, and find-all.js then returns
// neither — the default list requires isValidated true, and the moderation queue
// requires isValidated false *with* a null dateValidation. A document left in
// that combination disappears from the site instead of reverting to its last
// validated state.
async function autoRejectModification(documentId, reason, validationAuthor) {
  const comment = `Auto-rejected: ${reason}`.slice(
    0,
    VALIDATION_COMMENT_MAX_LENGTH
  );
  await markDocumentRejected(documentId, comment, validationAuthor);
  sails.log.warn(
    `Document ${documentId} modification auto-rejected: ${reason}`
  );
  return { rejected: true, reason: comment };
}

// modifiedDocJson may pre-date this fix and contain populated objects instead of plain IDs.
// Returns { scalarData, collectionData } where collectionData[field] is either an array of
// plain ids or undefined (meaning "not sent — keep existing associations").
function normalizeAndSplitDocumentData(documentData) {
  const scalarData = { ...documentData };
  const collectionData = {};

  for (const field of DOCUMENT_M2M_COLLECTIONS) {
    const value = scalarData[field];
    // Remove from the scalar payload regardless — .set() cannot handle collections.
    delete scalarData[field];

    if (value === undefined) {
      // Field was not sent by the client; leave existing associations untouched.
      collectionData[field] = undefined;
    } else if (Array.isArray(value)) {
      // Normalize: older modifiedDocJson entries may have stored populated objects.
      collectionData[field] = value.map((item) =>
        typeof item === 'object' && item !== null ? (item.id ?? item) : item
      );
    } else {
      // Unexpected value type — treat as "untouched" to be safe.
      collectionData[field] = undefined;
    }
  }

  return { scalarData, collectionData };
}

async function validateAndUpdateDocument(
  document,
  validationComment,
  validationAuthor
) {
  const {
    reviewerId,
    documentData,
    descriptionData,
    modifiedFiles,
    deletedFiles,
    newFiles,
  } = document.modifiedDocJson;

  const { scalarData, collectionData } =
    normalizeAndSplitDocumentData(documentData);

  // Re-validate the parent assignment against the current hierarchy.
  // The hierarchy may have changed since the modification was submitted
  // (e.g. a sibling was re-parented while this modification was pending),
  // so the stored parent could now create a cycle even though it passed
  // validation at submission time.
  // Also re-apply the type-vs-parent policy in case the stored type no
  // longer allows a parent (uses the stored type with a fallback to the
  // current document type, matching the update-with-new-entities.js path).
  const effectiveTypeId = scalarData.type ?? document.type;
  scalarData.parent = DocumentService.clearParentIfTypeDisallows(
    effectiveTypeId,
    scalarData.parent
  );
  if (scalarData.parent != null) {
    const parentError = await DocumentService.validateParentAssignment(
      document.id,
      scalarData.parent
    );
    if (parentError) {
      // Reject the modification rather than persisting a corrupt hierarchy.
      return autoRejectModification(document.id, parentError, validationAuthor);
    }
  }

  // Re-resolve the m2m collection members for the same reason as the parent:
  // modifiedDocJson is a submission-time snapshot, and a caver, organization or
  // reference-data row it names may have been deleted since. replaceCollection
  // would then fail with a foreign-key violation, which used to 500 and left the
  // document permanently unvalidatable.
  //
  // Members that no longer resolve are dropped and the rest of the edit is
  // applied, per the acceptance criterion in #1815: the reference is gone either
  // way, and refusing the whole modification would punish the contributor for an
  // administrative action they had no part in. Note a collection whose every
  // member has vanished therefore ends up cleared, which is what the snapshot
  // asked for minus the impossible part.
  //
  // The drop is only recorded in the log. modifiedDocJson is cleared on success,
  // so nothing else retains what the snapshot originally named.
  const applyModification = async () => {
    const { missing: missingMembers, resolved: resolvedCollectionData } =
      await DocumentService.resolveM2MMembers(collectionData);
    const destroyedFiles = [];

    await sails.getDatastore().transaction(async (db) => {
      // Update associated data not handled by TDocument manually
      // Updated before the TDocument update so the last_change_document DB trigger will fetch the last updated name
      await TDescription.updateOne({ document: document.id })
        .set(descriptionData)
        .usingConnection(db);

      await TDocument.updateOne(document.id)
        .set({
          ...scalarData,
          modifiedDocJson: null,
          dateReviewed: new Date(),
          reviewer: reviewerId,
          dateValidation: new Date(),
          isValidated: true,
          validationComment,
          validator: validationAuthor,
        })
        .usingConnection(db);

      // Replace m2m collections for every field that was explicitly sent by the
      // client (including an empty array, which means "clear all").
      // Fields not sent (undefined) are left untouched.
      await DocumentService.replaceM2MCollections(
        document.id,
        resolvedCollectionData,
        db
      );

      // Every file row is written through the transaction, so a failure
      // anywhere leaves the attachments as they were and the pending
      // modification safe to submit again. Sequential: the writes share one
      // connection, and a rollback must not race queries still in flight.
      // Files have already been created,
      // they just need to be linked to the document.
      for (const f of newFiles ?? []) {
        // eslint-disable-next-line no-await-in-loop
        await TFile.updateOne(f.id)
          .set({ isValidated: true })
          .usingConnection(db);
      }
      for (const f of modifiedFiles ?? []) {
        // eslint-disable-next-line no-await-in-loop
        await FileService.document.update(f, db);
      }
      for (const f of deletedFiles ?? []) {
        // eslint-disable-next-line no-await-in-loop
        const destroyed = await FileService.document.deleteRecord(f, db);
        // Already gone: nothing left to delete, and no reason to fail the edit.
        if (destroyed) destroyedFiles.push(destroyed);
      }
    });

    // Storage cannot be rolled back, so it is only touched once the rows are
    // committed. A failure here leaves an orphaned object, logged for cleanup,
    // but the document is validated and must be reported as such.
    await Promise.all(
      destroyedFiles.map((file) =>
        FileService.document
          .deleteStorage(file)
          .catch((err) =>
            sails.log.error(
              `Document ${document.id} validated but the storage of file ${file.id} (${file.path}) could not be deleted`,
              err
            )
          )
      )
    );

    // Logged after the commit, not before it: the line asserts the document was
    // validated, and an attempt that loses the race never validates anything. A
    // warning emitted up front would leave that claim in the log for a write
    // that rolled back, and be repeated by the attempt that actually applied —
    // misleading precisely where it matters, since this log line is the only
    // record of what the snapshot originally named.
    if (missingMembers.length > 0) {
      sails.log.warn(
        `Document ${document.id} validated with vanished linked entities dropped from its modification: ${DocumentService.formatMissingM2MMembers(
          missingMembers
        )}`
      );
    }
  };

  // A target row deleted between resolveM2MMembers and the inserts above lands
  // in the catch. The transaction rolled back, so the retry re-resolves against
  // the state that caused the failure and drops the member this time — the same
  // outcome the first pass would have produced, rather than discarding the edit
  // over a millisecond-wide race. Anything that is not a foreign-key violation
  // keeps propagating: see DocumentService.isForeignKeyViolation for why that
  // distinction matters.
  for (let attempt = 1; attempt <= MAX_APPLY_ATTEMPTS; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await applyModification();
      return { rejected: false };
    } catch (err) {
      if (!DocumentService.isForeignKeyViolation(err)) throw err;
    }
  }

  // Every attempt lost the race, which takes a deletion landing inside the same
  // narrow window twice over. Refusing is the last resort: it costs the edit, but
  // it leaves the document in its last validated state instead of permanently
  // unvalidatable, which is the failure #1815 reported.
  return autoRejectModification(
    document.id,
    'linked entities kept being deleted while this modification was being validated',
    validationAuthor
  );
}

async function updateSearchAndNotify(documentId, userId) {
  const document = await DocumentService.getPopulatedDocument(documentId);
  await DocumentService.updateInSearch(document);

  await NotificationService.notifySubscribers(
    document,
    userId,
    NotificationService.NOTIFICATION_TYPES.VALIDATE,
    NotificationService.NOTIFICATION_ENTITIES.DOCUMENT
  );

  return document;
}

// Outcome of one batch entry, as reported in the response (#1817).
const OUTCOME = {
  VALIDATED: 'validated',
  REJECTED: 'rejected',
  AUTO_REJECTED: 'auto_rejected',
  NOT_FOUND: 'not_found',
  ERROR: 'error',
};

// Deliberately generic: the response goes to the moderation UI, and the error
// itself (SQL, constraint names, stack) goes to the log instead.
const UNEXPECTED_ERROR_REASON =
  'Unexpected error while processing this document.';

async function notifyAuthorSafely(document, userId, type, comment) {
  await NotificationService.notifyAuthor(document, userId, type, comment).catch(
    (err) =>
      sails.log.error(
        'Document multiple-validate notifyAuthor error',
        document,
        err
      )
  );
}

async function notifyRejectionSafely(documentId, userId, comment) {
  let rejectedDoc;
  try {
    rejectedDoc = await DocumentService.getPopulatedDocument(documentId);
  } catch (err) {
    sails.log.error(
      `Document ${documentId} multiple-validate getPopulatedDocument error`,
      err
    );
    return;
  }
  await notifyAuthorSafely(
    rejectedDoc,
    userId,
    NotificationService.NOTIFICATION_TYPES.REJECT,
    comment
  );
}

// Applies one batch entry and returns its outcome. Everything that runs after
// the document's own write has committed (search index, notifications) logs
// and swallows its errors, so a failure there never reports a document as
// failed when it was in fact validated.
async function processDocument(document, change, userId) {
  if (!change.isValidated) {
    // Validate it but do not update its fields (reject change)
    await markDocumentRejected(document.id, change.validationComment, userId);
    await notifyRejectionSafely(document.id, userId, change.validationComment);
    return { status: OUTCOME.REJECTED, reason: null };
  }

  if (document.modifiedDocJson) {
    const result = await validateAndUpdateDocument(
      document,
      change.validationComment,
      userId
    );
    if (result.rejected) {
      // The pending modification was auto-rejected — it would have created a
      // parent cycle, or it repeatedly lost the race against a concurrent
      // delete. A member that no longer exists does not land here: it is
      // dropped and the rest of the edit is applied.
      // Send a REJECT author notification with the auto-rejection reason,
      // matching the behaviour of the manual-rejection path above.
      await notifyRejectionSafely(document.id, userId, result.reason);
      return { status: OUTCOME.AUTO_REJECTED, reason: result.reason };
    }
  } else {
    // Likely a document creation
    await markDocumentValidated(document.id, change.validationComment, userId);
  }

  const populatedDoc = await updateSearchAndNotify(document.id, userId).catch(
    (err) => {
      sails.log.error(
        'Document multiple validate updateSearchAndNotify error',
        document,
        err
      );
      return null;
    }
  );

  if (populatedDoc) {
    await notifyAuthorSafely(
      populatedDoc,
      userId,
      NotificationService.NOTIFICATION_TYPES.VALIDATE,
      change.validationComment
    );
  }

  return { status: OUTCOME.VALIDATED, reason: null };
}

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden(
      'You are not authorized to validate multiple documents.'
    );
  }

  const documents = req.param('documents');
  if (!Array.isArray(documents)) {
    return res.badRequest(
      sails.helpers.formatStructuredError(
        req,
        'documents must be an array.',
        'E_BAD_REQUEST',
        { field: 'documents', value: documents }
      )
    );
  }

  // Validate the whole batch before writing anything, so a bad entry cannot
  // leave the documents before it processed and the ones after it not.
  const documentChanges = [];
  for (const doc of documents) {
    if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
      return res.badRequest(
        sails.helpers.formatStructuredError(
          req,
          'Each entry of documents must be an object.',
          'E_BAD_REQUEST',
          { field: 'documents', value: doc }
        )
      );
    }

    if (!isValidId(doc.id)) {
      return res.badRequest(
        sails.helpers.formatStructuredError(
          req,
          'Each entry of documents must have a positive integer id.',
          'E_BAD_REQUEST',
          { field: 'id', value: doc.id }
        )
      );
    }

    // Whether or not the pending changes are accepted or not
    const isValidated = parseBool(doc.isValidated) ?? true;
    if (isValidated === parseBool.INVALID) {
      return res.badRequest(
        readBoolParam.formatInvalidBoolError(
          req,
          'isValidated',
          doc.isValidated
        )
      );
    }

    if (isValidated === false && !doc.validationComment) {
      return res.badRequest(
        `If the document with id ${doc.id} is refused, a comment must be provided.`
      );
    }

    documentChanges.push({
      id: doc.id,
      isValidated,
      validationComment: doc.validationComment,
    });
  }
  // A repeated id is processed once, with its first entry, as before.
  const seenIds = new Set();
  const uniqueChanges = documentChanges.filter(
    (c) => !seenIds.has(c.id) && seenIds.add(c.id)
  );
  const foundDocuments = await TDocument.find({
    id: uniqueChanges.map((c) => c.id),
  });
  const documentsById = new Map(foundDocuments.map((d) => [d.id, d]));

  // Sequential, and each document in its own transaction: one failing
  // document is reported and does not stop the others. Documents processed
  // before it stay committed, which is why every entry gets an outcome (#1817).
  const results = [];
  for (const change of uniqueChanges) {
    const document = documentsById.get(change.id);
    let outcome;
    if (!document) {
      outcome = { status: OUTCOME.NOT_FOUND, reason: null };
    } else {
      try {
        // eslint-disable-next-line no-await-in-loop
        outcome = await processDocument(document, change, req.token.id);
      } catch (err) {
        sails.log.error(
          `Document ${document.id} multiple-validate processing error`,
          err
        );
        outcome = { status: OUTCOME.ERROR, reason: UNEXPECTED_ERROR_REASON };
      }
    }
    results.push({ id: change.id, ...outcome });
  }

  // 207 tells a client that part of the batch was not applied without having
  // to read the body; the body is the same either way.
  if (results.some((r) => r.status === OUTCOME.ERROR)) {
    return res.multiStatus(results);
  }
  return res.ok(results);
};
