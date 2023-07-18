const ramda = require('ramda');
const ErrorService = require('../../../services/ErrorService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');

module.exports = async (req, res) => {
  // Check if document exists
  const documentId = req.param('id');
  const currentDocument = await TDocument.findOne(documentId);
  if (!currentDocument) {
    return res.notFound({
      message: `Document of id ${documentId} not found.`,
    });
  }

  const { document, newAuthors, newDescriptions } = req.body;

  const cleanedData = {
    ...document,
    id: documentId,
  };

  const checkForEmptiness = (value) => value && !ramda.isEmpty(value);

  // For each associated entites :
  // - check if there are new values
  // - create the corresponding values
  // - add the newly created values to the array of cleanedData
  //   otherwise, when the update will be done based on cleanedData, the relation will be deleted
  try {
    if (checkForEmptiness(newAuthors)) {
      const authorParams = newAuthors.map((author) => ({
        ...author,
        documents: [documentId],
      }));
      const createdAuthors = await TCaver.createEach(authorParams).fetch();
      const createdAuthorsIds = createdAuthors.map((author) => author.id);
      cleanedData.authors = ramda.concat(
        cleanedData.authors,
        createdAuthorsIds
      );
    }

    if (checkForEmptiness(newDescriptions)) {
      const descParams = newDescriptions.map((desc) => ({
        ...desc,
        document: documentId,
      }));
      const createdDescriptions = await TDescription.createEach(
        descParams
      ).fetch();
      const createdDescriptionsIds = createdDescriptions.map((desc) => desc.id);
      cleanedData.descriptions = ramda.concat(
        cleanedData.descriptions,
        createdDescriptionsIds
      );
    }
    const updatedDocument = await TDocument.updateOne(documentId).set(
      cleanedData
    );

    await NotificationService.notifySubscribers(
      req,
      updatedDocument,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.DOCUMENT
    );

    return res.ok(updatedDocument);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
