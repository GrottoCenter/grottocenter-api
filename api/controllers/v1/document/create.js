const ramda = require('ramda');
const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const ErrorService = require('../../../services/ErrorService');
const FileService = require('../../../services/FileService');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.DOCUMENT,
      rightAction: RightService.RightActions.CREATE,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to create a document.'
      )
    );
  if (!hasRight) {
    return res.forbidden('You are not authorized to create a document.');
  }

  const dataFromClient = await DocumentService.getConvertedDataFromClient(req);

  const cleanedData = {
    ...dataFromClient,
    author: req.token.id,
    dateInscription: new Date(),
  };

  const langDescData = DocumentService.getLangDescDataFromClient(req);

  try {
    const createdDocument = await DocumentService.createDocument(
      cleanedData,
      langDescData
    );
    const errorFiles = [];
    if (req.files && req.files.files) {
      const { files } = req.files;
      try {
        await Promise.all(
          files.map(async (file) => {
            await FileService.create(file, createdDocument.id);
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
