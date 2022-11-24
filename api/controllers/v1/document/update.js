const ramda = require('ramda');
const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const DocumentService = require('../../../services/DocumentService');
const ErrorService = require('../../../services/ErrorService');
const FileService = require('../../../services/FileService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toDocument } = require('../../../services/mapping/converters');

const { INVALID_FORMAT, INVALID_NAME, ERROR_DURING_UPLOAD_TO_AZURE } =
  FileService;
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

module.exports = async (req, res) => {
  const docWithModif = await TDocument.findOne({
    id: req.param('id'),
    modifiedDocJson: { '!=': null },
  });
  const rightAction = docWithModif
    ? RightService.RightActions.EDIT_NOT_VALIDATED
    : RightService.RightActions.EDIT_ANY;
  const hasRight = await sails.helpers.checkRight
    .with({
      groups: req.token.groups,
      rightEntity: RightService.RightEntities.DOCUMENT,
      rightAction,
    })
    .intercept('rightNotFound', () =>
      res.serverError(
        'A server error occured when checking your right to update a document.'
      )
    );

  if (!hasRight) {
    return res.forbidden(
      `You are not authorized to update a document${
        docWithModif && ' with modifications waiting a moderator approval'
      }.`
    );
  }

  // Add new files
  const newFilesArray = [];
  if (req.files && req.files.files) {
    const { files } = req.files;
    try {
      await Promise.all(
        files.map(async (file) => {
          const createdFile = await FileService.create(
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
  const jsonData = {
    ...dataFromClient,
    ...descriptionData,
    id: req.param('id'),
    author: req.token.id,
    newFiles: ramda.isEmpty(newFilesArray) ? undefined : newFilesArray,
  };
  try {
    const updatedDocument = await TDocument.updateOne(req.param('id')).set({
      isValidated: false,
      dateValidation: null,
      dateReviewed: new Date(),
      modifiedDocJson: jsonData,
    });
    if (!updatedDocument) {
      return res.notFound();
    }

    await NotificationService.notifySubscribers(
      req,
      updatedDocument,
      req.token.id,
      NOTIFICATION_TYPES.UPDATE,
      NOTIFICATION_ENTITIES.DOCUMENT
    );

    await DescriptionService.setDocumentDescriptions(updatedDocument, false);
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
