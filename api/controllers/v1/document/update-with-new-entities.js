const DocumentService = require('../../../services/DocumentService');
const NotificationService = require('../../../services/NotificationService');
const {
  DOCUMENT_M2M_COLLECTIONS,
} = require('../../../../config/constants/document');

// The seven m2m associations on TDocument that must be handled via replaceCollection.
// Waterline silently ignores collection fields passed to .update()/.set().
// Defined in config/constants/document.js — single source of truth.

module.exports = async (req, res) => {
  // Check if document exists
  const documentId = req.param('id');
  const currentDocument = await TDocument.findOne(documentId);
  if (!currentDocument || currentDocument.isDeleted) {
    return res.notFound({
      message: `Document of id ${documentId} not found.`,
    });
  }

  const { document, newAuthors, newDescriptions } = req.body;

  // Split m2m fields out of the scalar payload — Waterline ignores them in .set().
  const scalarData = { ...document, id: documentId };
  const collectionData = {};
  for (const field of DOCUMENT_M2M_COLLECTIONS) {
    collectionData[field] = scalarData[field];
    delete scalarData[field];
  }

  const isArrNotEmpty = (value) => Array.isArray(value) && value.length > 0;

  if (isArrNotEmpty(newDescriptions)) {
    const missingLanguage = newDescriptions.some((desc) => !desc.language);
    if (missingLanguage) {
      return res.badRequest(
        'Each new description must include a language field.'
      );
    }
  }

  // Wrap the scalar update, entity creation, and all replaceCollection calls in
  // a single transaction so the document is never left in a partially-updated state.
  let updatedDocument;
  await sails.getDatastore().transaction(async (db) => {
    // Create new cavers inside the transaction so they roll back if the update fails.
    if (isArrNotEmpty(newAuthors)) {
      const authorParams = newAuthors.map((author) => ({
        ...author,
        documents: [documentId],
      }));
      const createdAuthors = await TCaver.createEach(authorParams)
        .fetch()
        .usingConnection(db);
      const createdAuthorsIds = createdAuthors.map((author) => author.id);

      // When the client sends an explicit authors list, merge new ids into it so
      // replaceCollection sets the final desired state.
      // When authors is absent (undefined), leave collectionData.authors as undefined
      // so replaceM2MCollections skips the field entirely. The junction-table rows
      // for the newly created cavers are already written by createEach above
      // (via `documents: [documentId]` in authorParams), so no extra addToCollection
      // call is needed — and making one would cause a PK violation on the
      // j_document_caver_author composite key.
      if (collectionData.authors !== undefined) {
        collectionData.authors = [].concat(
          collectionData.authors,
          createdAuthorsIds
        );
      }
    }

    // Update the document first so the row lock is held before createEach for
    // descriptions runs. Creating a description with `document: documentId` causes
    // Waterline to resolve the FK, which can deadlock against the subsequent
    // updateOne if both run inside the same transaction in the opposite order.
    updatedDocument = await TDocument.updateOne(documentId)
      .set(scalarData)
      .usingConnection(db);

    // Create new descriptions after the document update (lock ordering above).
    // Descriptions are linked to the document via the `document` FK on each row —
    // no further action needed. Passing ids into scalarData.descriptions would be
    // a silent no-op: descriptions is a Waterline collection and .set() ignores it.
    if (isArrNotEmpty(newDescriptions)) {
      const descParams = newDescriptions.map((desc) => ({
        ...desc,
        document: documentId,
      }));
      await TDescription.createEach(descParams).fetch().usingConnection(db);
    }

    // Replace m2m collections for every field that was explicitly provided by the
    // client (including an empty array, which means "clear all").
    // Fields absent from the request (undefined) are left untouched.
    await DocumentService.replaceM2MCollections(documentId, collectionData, db);
  });

  await NotificationService.notifySubscribers(
    updatedDocument,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.DOCUMENT
  );

  return res.ok(updatedDocument);
};
