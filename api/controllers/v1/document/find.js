const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const RightService = require('../../../services/RightService');
const {
  toDocument,
  toDeletedEntity,
  toDocumentDescriptions,
} = require('../../../services/mapping/converters');
const readBoolParam = require('../../../utils/readBoolParam');

async function getModifiedDocumentData(documentId) {
  const current = await TDocument.findOne(documentId);
  if (!current || current.modifiedDocJson === null) return null;
  const { id, modifiedDocJson } = current;

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
  // An omitted offset leaves the stored one unchanged; null is an explicit clear
  if (populatedDoc.identifierPdfPageOffset === undefined) {
    populatedDoc.identifierPdfPageOffset = current.identifierPdfPageOffset;
  }

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

  populatedDoc.files = await TFile.find(filesCriterias);
  populatedDoc.newFiles = newFiles;
  populatedDoc.deletedFiles = deletedFiles;
  // A modification only carries the fields it changes: show them over the
  // stored file, so the preview reads like the file once validated.
  const modifiedFilesStored =
    modifiedFiles?.length > 0
      ? await TFile.find({
          id: modifiedFiles.map((file) => file.id),
          document: id,
        })
      : [];
  const storedById = new Map(
    modifiedFilesStored.map((file) => [String(file.id), file])
  );
  populatedDoc.modifiedFiles = modifiedFiles?.map((file) => ({
    ...storedById.get(String(file.id)),
    ...file,
  }));

  return populatedDoc;
}

module.exports = async (req, res) => {
  const documentId = Number(req.param('id'));

  const hasRight = RightService.hasGroup(
    req.token?.groups,
    RightService.G.MODERATOR
  );

  const { value: requireUpdate, error: requireUpdateError } = readBoolParam(
    req,
    'requireUpdate',
    false
  );
  if (requireUpdateError) return res.badRequest(requireUpdateError);

  let document;
  // Get the modified document
  if (requireUpdate) document = await getModifiedDocumentData(documentId);

  // Get the base document
  if (!document)
    document = await DocumentService.getPopulatedDocument(documentId);

  const params = {
    controllerMethod: 'DocumentController.find',
    searchedItem: `Document of id ${documentId}`,
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
