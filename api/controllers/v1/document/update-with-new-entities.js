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

  // For each associated entites :
  // - check if there are new values
  // - create the corresponding values
  // - add the newly created values to the array of collectionData
  if (isArrNotEmpty(newAuthors)) {
    const authorParams = newAuthors.map((author) => ({
      ...author,
      documents: [documentId],
    }));
    const createdAuthors = await TCaver.createEach(authorParams).fetch();
    const createdAuthorsIds = createdAuthors.map((author) => author.id);
    // Merge newly created author ids into the authors collection.
    // collectionData.authors may be undefined (not sent) — start from [] in that case.
    collectionData.authors = [].concat(
      collectionData.authors ?? [],
      createdAuthorsIds
    );
  }

  if (isArrNotEmpty(newDescriptions)) {
    const missingLanguage = newDescriptions.some((desc) => !desc.language);
    if (missingLanguage) {
      return res.badRequest(
        'Each new description must include a language field.'
      );
    }

    const descParams = newDescriptions.map((desc) => ({
      ...desc,
      document: documentId,
    }));
    const createdDescriptions =
      await TDescription.createEach(descParams).fetch();
    const createdDescriptionsIds = createdDescriptions.map((desc) => desc.id);
    scalarData.descriptions = [].concat(
      scalarData.descriptions ?? [],
      createdDescriptionsIds
    );
  }

  // Wrap both the scalar update and all replaceCollection calls in a single
  // transaction so the document is never left in a partially-updated state.
  let updatedDocument;
  await sails.getDatastore().transaction(async (db) => {
    updatedDocument = await TDocument.updateOne(documentId)
      .set(scalarData)
      .usingConnection(db);

    // Replace m2m collections for every field that was explicitly provided by the
    // client (including an empty array, which means "clear all").
    // Fields absent from the request (undefined) are left untouched.
    const collectionPromises = DOCUMENT_M2M_COLLECTIONS.filter(
      (field) => collectionData[field] !== undefined
    ).map((field) =>
      TDocument.replaceCollection(documentId, field)
        .members(collectionData[field])
        .usingConnection(db)
    );
    await Promise.all(collectionPromises);
  });

  await NotificationService.notifySubscribers(
    updatedDocument,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.DOCUMENT
  );

  return res.ok(updatedDocument);
};
