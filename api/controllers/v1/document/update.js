const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const ErrorService = require('../../../services/ErrorService');
const FileService = require('../../../services/FileService');
const RightService = require('../../../services/RightService');
const { toDocument } = require('../../../services/mapping/converters');

const { INVALID_FORMAT, INVALID_NAME, ERROR_DURING_UPLOAD_TO_AZURE } =
  FileService;

module.exports = async (req, res) => {
  const docWithModif = await TDocument.findOne({
    id: req.param('id'),
    modifiedDocJson: { '!=': null },
  });

  if (docWithModif) {
    const hasRight = RightService.hasGroup(
      req.token.groups,
      RightService.G.MODERATOR
    );

    if (!hasRight) {
      return res.forbidden(
        `You are not authorized to update a document with modifications waiting a moderator approval.`
      );
    }
  }

  // Add new files
  const newFilesArray = [];
  if (req.files && req.files.files) {
    const { files } = req.files;
    try {
      await Promise.all(
        files.map(async (file) => {
          const createdFile = await FileService.document.create(
            file,
            req.param('id'),
            true,
            false
          );
          newFilesArray.push(createdFile);
        })
      );
    } catch (err) {
      const { message, fileName } = err;
      switch (message) {
        case INVALID_FORMAT:
          return res.badRequest(
            `The format of the file "${fileName}" is invalid.`
          );
        case INVALID_NAME:
          return res.badRequest(
            `The name of the file "${fileName}" is invalid.`
          );
        case ERROR_DURING_UPLOAD_TO_AZURE:
        default:
          return res.serverError(
            'An error occured when trying to upload the file to Azure.'
          );
      }
    }
  }

  // Update json data (upcoming modifications which need to be validated)
  const dataFromClient = await DocumentService.getConvertedDataFromClient(req);
  const descriptionData = await DocumentService.getLangDescDataFromClient(req);

  try {
    const updatedDocument = await DocumentService.updateDocument(
      req,
      dataFromClient,
      descriptionData,
      newFilesArray
    );
    if (!updatedDocument) {
      return res.notFound();
    }

    const params = {};
    params.controllerMethod = 'DocumentController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      updatedDocument,
      params,
      res,
      toDocument
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
