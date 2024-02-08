const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const {
  toDocument,
  toDeletedDocument,
} = require('../../../services/mapping/converters');

async function getModifiedDocumentData(documentId) {
  const { id, modifiedDocJson } = await TDocument.findOne(documentId);
  if (modifiedDocJson === null) return null;

  const {
    // reviewerId,
    documentData,
    descriptionData,
    newFiles,
    modifiedFiles,
    deletedFiles,
  } = modifiedDocJson;

  const populatedDoc = await DocumentService.populateJSON(
    documentId,
    documentData
  );
  populatedDoc.descriptions = [descriptionData];

  // Files retrieval
  const filesCriterias = {
    document: id,
    isValidated: true,
  };
  // Don't retrieve files which are modified, new or deleted (because we already have them).
  // New are those which have isValidated = false
  const filesToIgnore = [].concat(
    newFiles ?? [],
    modifiedFiles ?? [],
    deletedFiles ?? []
  );
  if (filesToIgnore.length > 0) {
    const filesToIgnoreId = filesToIgnore.map((file) => file.id);
    filesCriterias.id = { '!=': filesToIgnoreId };
  }

  const files = await TFile.find(filesCriterias);
  populatedDoc.files = files; // Other current document File
  populatedDoc.newFiles = newFiles;
  populatedDoc.deletedFiles = deletedFiles;
  populatedDoc.modifiedFiles = modifiedFiles;

  return populatedDoc;
}

module.exports = async (req, res) => {
  let found;
  // Get the modified document
  if (req.param('requireUpdate') === 'true')
    found = await getModifiedDocumentData(req.param('id'));

  // Get the base document
  if (!found)
    found = await DocumentService.appendPopulateForFullDocument(
      TDocument.findOne(req.param('id'))
    );

  const params = {
    controllerMethod: 'DocumentController.find',
    searchedItem: `Document of id ${req.param('id')}`,
  };
  if (!found) return res.notFound(`${params.searchedItem} not found`);
  if (found.isDeleted) {
    return ControllerService.treatAndConvert(
      req,
      null,
      found,
      params,
      res,
      toDeletedDocument
    );
  }

  await DocumentService.populateFullDocumentSubEntities(found);

  return ControllerService.treatAndConvert(
    req,
    null,
    found,
    params,
    res,
    toDocument
  );
};
