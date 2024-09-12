const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const RightService = require('../../../services/RightService');
const {
  toDocument,
  toDeletedEntity,
  toDocumentDescriptions,
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
  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  let document;
  // Get the modified document
  if (req.param('requireUpdate') === 'true')
    document = await getModifiedDocumentData(req.param('id'));

  // Get the base document
  if (!document)
    document = await DocumentService.getPopulatedDocument(req.param('id'));

  const params = {
    controllerMethod: 'DocumentController.find',
    searchedItem: `Document of id ${req.param('id')}`,
  };
  if (!document) return res.notFound(`${params.searchedItem} not found`);

  if (document.isDeleted) {
    document = {
      ...document,
      ...toDocumentDescriptions(document.descriptions),
    };
  }

  return ControllerService.treatAndConvert(
    req,
    null,
    document,
    params,
    res,
    document.isDeleted && !hasRight ? toDeletedEntity : toDocument
  );
};
