const DocumentService = require('../../../services/DocumentService');
const FileService = require('../../../services/FileService');
const RightService = require('../../../services/RightService');
const NotificationService = require('../../../services/NotificationService');

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

// modifiedDocJson may pre-date this fix and contain populated objects instead of plain IDs.
function normalizeCollectionIds(documentData) {
  const collectionFields = [
    'massifs',
    'authors',
    'authorsGrotto',
    'subjects',
    'languages',
    'isoRegions',
    'countries',
  ];
  const normalized = { ...documentData };
  for (const field of collectionFields) {
    if (Array.isArray(normalized[field])) {
      normalized[field] = normalized[field].map((item) =>
        typeof item === 'object' && item !== null ? (item.id ?? item) : item
      );
    }
  }
  return normalized;
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

  const cleanedDocumentData = normalizeCollectionIds(documentData);

  await sails.getDatastore().transaction(async (db) => {
    // Update associated data not handled by TDocument manually
    // Updated before the TDocument update so the last_change_document DB trigger will fetch the last updated name
    await TDescription.updateOne({ document: document.id })
      .set(descriptionData)
      .usingConnection(db);

    await TDocument.updateOne(document.id)
      .set({
        ...cleanedDocumentData,
        modifiedDocJson: null,
        dateReviewed: new Date(),
        reviewer: reviewerId,
        dateValidation: new Date(),
        isValidated: true,
        validationComment,
        validator: validationAuthor,
      })
      .usingConnection(db);

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
      await validateAndUpdateDocument(
        document,
        change.validationComment,
        req.token.id
      );
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
