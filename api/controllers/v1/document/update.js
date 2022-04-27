const ramda = require('ramda');
const ControllerService = require('../../../services/ControllerService');
const DescriptionService = require('../../../services/DescriptionService');
const DocumentService = require('../../../services/DocumentService');
const ErrorService = require('../../../services/ErrorService');
const FileService = require('../../../services/FileService');
const MappingService = require('../../../services/MappingService');
const RightService = require('../../../services/RightService');

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
    return res.forbidden('You are not authorized to update a document.');
  }

  // Add new files
  const newFilesArray = [];
  if (req.files && req.files.files) {
    const { files } = req.files;
    for (const file of files) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const createdFile = await FileService.create(
          file,
          req.param('id'),
          true,
          false
        );
        newFilesArray.push(createdFile);
      } catch (err) {
        return res.serverError(err);
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
      return res.status(404);
    }

    await DescriptionService.setDocumentDescriptions(updatedDocument, false);
    const params = {};
    params.controllerMethod = 'DocumentController.update';
    return ControllerService.treatAndConvert(
      req,
      null,
      updatedDocument,
      params,
      res,
      MappingService.convertToDocumentModel
    );
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
