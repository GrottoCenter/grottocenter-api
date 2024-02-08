const DocumentService = require('../../../services/DocumentService');
const FileService = require('../../../services/FileService');
const RightService = require('../../../services/RightService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
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

  await sails.getDatastore().transaction(async (db) => {
    // Update associated data not handled by TDocument manually
    // Updated before the TDocument update so the last_change_document DB trigger will fetch the last updated name
    await TDescription.updateOne({ document: document.id })
      .set(descriptionData)
      .usingConnection(db);

    await TDocument.updateOne(document.id)
      .set({
        ...documentData,
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

async function updateESAndNotify(req, documentId, hasChange, userId) {
  const found = await DocumentService.appendPopulateForSimpleDocument(
    TDocument.findOne(documentId)
  );

  await DocumentService.populateFullDocumentSubEntities(found);

  if (hasChange) {
    await DocumentService.updateDocumentInElasticSearchIndexes(found);
  } else {
    await DocumentService.addDocumentToElasticSearchIndexes(found);
  }

  await NotificationService.notifySubscribers(
    req,
    found,
    userId,
    NOTIFICATION_TYPES.VALIDATE,
    NOTIFICATION_ENTITIES.DOCUMENT
  );
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
    await updateESAndNotify(
      res,
      document.id,
      isAModifiedDoc,
      req.token.id
    ).catch((err) =>
      sails.log.error(
        'Document multiple validate updateESAndNotify error',
        document,
        err
      )
    );
  }

  return res.ok();
};
