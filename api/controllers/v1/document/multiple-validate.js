const DocumentService = require('../../../services/DocumentService');
const FileService = require('../../../services/FileService');
const RightService = require('../../../services/RightService');
const NotificationService = require('../../../services/NotificationService');
const {
  DOCUMENT_M2M_COLLECTIONS,
} = require('../../../../config/constants/document');

async function markDocumentValidated(
  documentId,
  validationComment,
  validationAuthor
) {
  await TDocument.updateOne(documentId).set({
    isValidated: true,
    modifiedDocJson: null,
    dateValidation: new Date(),
    validationComment,
    validator: validationAuthor,
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
// isValidated must be restored to true, matching the manual-rejection path in
// markDocumentValidated. Submitting a modification sets isValidated false and
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
  await TDocument.updateOne(documentId).set({
    isValidated: true,
    modifiedDocJson: null,
    validationComment: comment,
    validator: validationAuthor,
    dateValidation: new Date(),
  });
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
    if (missingMembers.length > 0) {
      sails.log.warn(
        `Document ${document.id} validated with vanished linked entities dropped from its modification: ${DocumentService.formatMissingM2MMembers(
          missingMembers
        )}`
      );
    }

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

      const filePromises = [];
      // Files have already been created,
      // they just need to be linked to the document.
      if (newFiles) {
        filePromises.push(
          ...newFiles.map((f) =>
            TFile.updateOne(f.id).set({ isValidated: true })
          )
        );
      }
      if (modifiedFiles) {
        filePromises.push(
          ...modifiedFiles.map((f) => FileService.document.update(f))
        );
      }

      if (deletedFiles) {
        filePromises.push(
          ...deletedFiles.map((f) => FileService.document.delete(f))
        );
      }
      await Promise.all(filePromises);
    });
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

async function updateSearchAndNotify(req, documentId, userId) {
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

  const documentChanges = [];
  // Validate input
  for (const doc of req.param('documents') ?? []) {
    // Whether or not the pending changes are accepted or not
    const isValidated = doc.isValidated
      ? doc.isValidated.toLowerCase() !== 'false'
      : true;

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
  const documentIds = documentChanges.map((e) => e.id);
  const foundDocuments = await TDocument.find({ id: documentIds });

  // Sequential to preserve partial-success semantics per document
  for (const document of foundDocuments) {
    const change = documentChanges.find((d) => d.id === document.id);
    const isAModifiedDoc = !!document.modifiedDocJson;
    if (!change.isValidated) {
      // Validate it but do not update its fields (reject change)
      // eslint-disable-next-line no-await-in-loop
      await markDocumentValidated(
        document.id,
        change.validationComment,
        req.token.id
      );
      // eslint-disable-next-line no-await-in-loop
      const rejectedDoc = await DocumentService.getPopulatedDocument(
        document.id
      );
      // eslint-disable-next-line no-await-in-loop
      await NotificationService.notifyAuthor(
        rejectedDoc,
        req.token.id,
        NotificationService.NOTIFICATION_TYPES.REJECT,
        change.validationComment
      ).catch((err) =>
        sails.log.error(
          'Document multiple-validate notifyAuthor error',
          document,
          err
        )
      );
      continue; // eslint-disable-line no-continue
    }

    if (isAModifiedDoc) {
      // eslint-disable-next-line no-await-in-loop
      const result = await validateAndUpdateDocument(
        document,
        change.validationComment,
        req.token.id
      );
      if (result.rejected) {
        // The pending modification was auto-rejected — it would have created a
        // parent cycle, or it repeatedly lost the race against a concurrent
        // delete. A member that no longer exists does not land here: it is
        // dropped and the rest of the edit is applied.
        // Send a REJECT author notification with the auto-rejection reason,
        // matching the behaviour of the manual-rejection path above.
        // eslint-disable-next-line no-await-in-loop
        const rejectedDoc = await DocumentService.getPopulatedDocument(
          document.id
        );
        // eslint-disable-next-line no-await-in-loop
        await NotificationService.notifyAuthor(
          rejectedDoc,
          req.token.id,
          NotificationService.NOTIFICATION_TYPES.REJECT,
          result.reason
        ).catch((err) =>
          sails.log.error(
            'Document multiple-validate notifyAuthor error',
            document,
            err
          )
        );
        continue; // eslint-disable-line no-continue
      }
    } else {
      // Likely a document creation
      // eslint-disable-next-line no-await-in-loop
      await markDocumentValidated(
        document.id,
        change.validationComment,
        req.token.id
      );
    }

    // eslint-disable-next-line no-await-in-loop
    const populatedDoc = await updateSearchAndNotify(
      req,
      document.id,
      req.token.id
    ).catch((err) => {
      sails.log.error(
        'Document multiple validate updateSearchAndNotify error',
        document,
        err
      );
      return null;
    });

    if (populatedDoc) {
      // eslint-disable-next-line no-await-in-loop
      await NotificationService.notifyAuthor(
        populatedDoc,
        req.token.id,
        NotificationService.NOTIFICATION_TYPES.VALIDATE,
        change.validationComment
      ).catch((err) =>
        sails.log.error(
          'Document multiple-validate notifyAuthor error',
          document,
          err
        )
      );
    }
  }

  return res.ok();
};
