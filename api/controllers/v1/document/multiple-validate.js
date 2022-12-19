const DocumentService = require('../../../services/DocumentService');
const ErrorService = require('../../../services/ErrorService');
const FileService = require('../../../services/FileService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');

module.exports = async (req, res) => {
  const documents = req.param('documents');
  const updatePromises = [];
  documents.map((doc) => {
    const isValidated = doc.isValidated
      ? !(doc.isValidated.toLowerCase() === 'false')
      : true;
    const { validationComment } = doc;
    const { id } = doc;

    if (isValidated === false && !validationComment) {
      return res.badRequest(
        `If the document with id ${req.param(
          'id'
        )} is refused, a comment must be provided.`
      );
    }

    updatePromises.push(
      TDocument.updateOne({ id }).set({
        dateValidation: new Date(),
        isValidated,
        validationComment,
        validator: req.token.id,
      })
    );
    return doc;
  });

  try {
    // eslint-disable-next-line consistent-return
    await Promise.all(updatePromises).then(async (results) => {
      for (const doc of results) {
        const isAModifiedDoc = !!doc.modifiedDocJson;
        if (doc.isValidated) {
          // If there is modified doc stored in the json column,
          // update the document with the data contained in it. Then, remove the json.
          if (isAModifiedDoc) {
            // eslint-disable-next-line no-await-in-loop
            await sails
              .getDatastore()
              // eslint-disable-next-line consistent-return
              .transaction(async (db) => {
                const {
                  documentMainLanguage,
                  author,
                  description,
                  titleAndDescriptionLanguage,
                  title,
                  modifiedFiles,
                  deletedFiles,
                  newFiles,
                  ...cleanedData
                } = doc.modifiedDocJson;
                cleanedData.modifiedDocJson = null;
                const updatedDocument = await TDocument.updateOne(doc.id)
                  .set({
                    ...cleanedData,
                    // Currently, only one language per document is allowed
                    ...(documentMainLanguage && {
                      languages: documentMainLanguage.id,
                    }),
                  })
                  .usingConnection(db);
                if (!updatedDocument) {
                  return res.notFound();
                }

                // Update associated data not handled by TDocument manually
                await TDescription.updateOne({ document: updatedDocument.id })
                  .set({
                    author,
                    body: description,
                    document: updatedDocument.id,
                    language: titleAndDescriptionLanguage.id,
                    title,
                  })
                  .usingConnection(db);

                // New files have already been created,
                // they just need to be linked to the document.
                if (newFiles) {
                  const newPromises = newFiles.map(
                    async (file) =>
                      // eslint-disable-next-line no-return-await
                      await TFile.updateOne(file.id).set({
                        isValidated: true,
                      })
                  );
                  await Promise.all(newPromises);
                }
                if (modifiedFiles) {
                  const modificationPromises = modifiedFiles.map(
                    // eslint-disable-next-line no-return-await
                    async (file) => await FileService.update(file)
                  );
                  await Promise.all(modificationPromises);
                }

                if (deletedFiles) {
                  const deletionPromises = deletedFiles.map(
                    // eslint-disable-next-line no-return-await
                    async (file) => await FileService.delete(file)
                  );
                  await Promise.all(deletionPromises);
                }
              })
              .intercept((err) =>
                ErrorService.getDefaultErrorHandler(res)(err)
              );
          }
          // Get full document an index it in Elasticsearch
          try {
            // eslint-disable-next-line no-await-in-loop
            const found = await TDocument.findOne(doc.id)
              .populate('author')
              .populate('authorizationDocument')
              .populate('authors')
              .populate('cave')
              .populate('descriptions')
              .populate('editor')
              .populate('entrance')
              .populate('identifierType')
              .populate('languages')
              .populate('library')
              .populate('license')
              .populate('massif')
              .populate('option')
              .populate('parent')
              .populate('regions')
              .populate('reviewer')
              .populate('subjects')
              .populate('type');
            // eslint-disable-next-line no-await-in-loop
            await DocumentService.setNamesOfPopulatedDocument(found);
            if (isAModifiedDoc) {
              // eslint-disable-next-line no-await-in-loop
              await DocumentService.updateDocumentInElasticSearchIndexes(found);
            } else {
              // eslint-disable-next-line no-await-in-loop
              await DocumentService.addDocumentToElasticSearchIndexes(found);
            }
            // eslint-disable-next-line no-await-in-loop
            await NotificationService.notifySubscribers(
              req,
              found,
              req.token.id,
              NOTIFICATION_TYPES.VALIDATE,
              NOTIFICATION_ENTITIES.DOCUMENT
            );
          } catch (err) {
            return res.serverError(
              'An error occured when trying to get all information about the document.'
            );
          }
        } else if (isAModifiedDoc) {
          /*
          If the document refused, check if there is a json document.
          If there is one, remove it and validate the document
          because the document kept the same values as when
          it was validated (the modified data was in the json).
          */
          // eslint-disable-next-line no-await-in-loop
          await TDocument.updateOne(doc.id).set({
            isValidated: true,
            modifiedDocJson: null,
          });
        }
      }
    });
    return res.ok();
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
