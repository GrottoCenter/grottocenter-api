const ramda = require('ramda');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const ErrorService = require('../../../services/ErrorService');
const FileService = require('../../../services/FileService');

module.exports = async (req, res) => {
  const dataFromClient = await DocumentService.getConvertedDataFromClient(req);

  const cleanedData = {
    ...dataFromClient,
    author: req.token.id,
    dateInscription: new Date(),
  };

  const langDescData = DocumentService.getLangDescDataFromClient(req);

  try {
    const createdDocument = await DocumentService.createDocument(
      req,
      cleanedData,
      langDescData
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

    const requestResponse = {
      document: createdDocument,
      status: !ramda.isEmpty(errorFiles)
        ? {
            errorCode: 'FileNotImported',
            errorString: 'Some files were not imported.',
            content: errorFiles,
          }
        : undefined,
    };

    const params = {};
    params.controllerMethod = 'DocumentController.create';
    return ControllerService.treat(req, null, requestResponse, params, res);
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
