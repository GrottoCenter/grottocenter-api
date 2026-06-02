const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const { toDocument } = require('../../../services/mapping/converters');
const FileService = require('../../../services/FileService');
const {
  TYPES_ALLOWING_ISSUE,
} = require('../../../../config/constants/document');

module.exports = async (req, res) => {
  const documentData = await DocumentService.getConvertedDataFromClient(
    req.body
  );
  const descriptionData = DocumentService.getDescriptionDataFromClient(
    req.body,
    req.token.id
  );

  // Validate that the issue field is only set for types that support it
  if (
    documentData.issue != null &&
    !TYPES_ALLOWING_ISSUE.includes(documentData.type)
  ) {
    return res.badRequest(
      'The "issue" field is only allowed for documents of type Book or Issue. ' +
        'Articles should be linked to a parent document of type Issue instead.'
    );
  }

  const cleanedData = {
    ...documentData,
    author: req.token.id,
    dateInscription: new Date(),
  };

  const createdDocument = await DocumentService.createDocument(
    req,
    cleanedData,
    descriptionData
  );
  const errorFiles = [];
  if (req.files && req.files.files) {
    const { files } = req.files;
    try {
      await Promise.all(
        files.map(async (file) => {
          await FileService.document.create(file, createdDocument.id);
        })
      );
    } catch (err) {
      errorFiles.push({
        fileName: err.fileName,
        error: err.message,
      });
    }
  }

  const newDoc = await DocumentService.getPopulatedDocument(createdDocument.id);

  const out = {
    document: toDocument(newDoc),
    status:
      errorFiles.length > 0
        ? {
            errorCode: 'FileNotImported',
            errorString: 'Some files were not imported.',
            content: errorFiles,
          }
        : undefined,
  };

  return ControllerService.treat(
    req,
    null,
    out,
    { controllerMethod: 'DocumentController.create' },
    res
  );
};
