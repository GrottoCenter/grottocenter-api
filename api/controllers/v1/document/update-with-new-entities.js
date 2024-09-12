const NotificationService = require('../../../services/NotificationService');

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

  const cleanedData = {
    ...document,
    id: documentId,
  };

  const isArrNotEmpty = (value) => Array.isArray(value) && value.length > 0;

  // For each associated entites :
  // - check if there are new values
  // - create the corresponding values
  // - add the newly created values to the array of cleanedData
  //   otherwise, when the update will be done based on cleanedData, the relation will be deleted

  if (isArrNotEmpty(newAuthors)) {
    const authorParams = newAuthors.map((author) => ({
      ...author,
      documents: [documentId],
    }));
    const createdAuthors = await TCaver.createEach(authorParams).fetch();
    const createdAuthorsIds = createdAuthors.map((author) => author.id);
    cleanedData.authors = [].concat(cleanedData.authors, createdAuthorsIds);
  }

  if (isArrNotEmpty(newDescriptions)) {
    const descParams = newDescriptions.map((desc) => ({
      ...desc,
      document: documentId,
    }));
    const createdDescriptions =
      await TDescription.createEach(descParams).fetch();
    const createdDescriptionsIds = createdDescriptions.map((desc) => desc.id);
    cleanedData.descriptions = [].concat(
      cleanedData.descriptions,
      createdDescriptionsIds
    );
  }
  const updatedDocument =
    await TDocument.updateOne(documentId).set(cleanedData);

  await NotificationService.notifySubscribers(
    req,
    updatedDocument,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.DOCUMENT
  );

  return res.ok(updatedDocument);
};
