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
      // Clear the pending modification so the document returns to its last
      // validated state and the moderator is informed of why it was rejected.
      await TDocument.updateOne(document.id).set({
        modifiedDocJson: null,
        validationComment: `Auto-rejected: ${parentError}`,
        validator: validationAuthor,
        dateValidation: new Date(),
      });
      sails.log.warn(
        `Document ${document.id} modification auto-rejected: ${parentError}`
      );
      return { rejected: true, reason: `Auto-rejected: ${parentError}` };
    }
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
      collectionData,
      db
    );

    const filePromises = [];
    // Files have already been created,
    // they just need to be linked to the document.
    if (newFiles) {
      filePromises.push(
        ...newFiles.map((f) => TFile.updateOne(f.id).set({ isValidated: true }))
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
  return { rejected: false };
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
        // The pending modification was auto-rejected due to a parent cycle.
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
