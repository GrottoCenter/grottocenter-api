const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const NotificationService = require('../../../services/NotificationService');
const FileService = require('../../../services/FileService');
const RightService = require('../../../services/RightService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const { toDocument } = require('../../../services/mapping/converters');

const { INVALID_FORMAT, INVALID_NAME, ERROR_DURING_UPLOAD_TO_AZURE } =
  FileService;

module.exports = async (req, res) => {
  const document = await TDocument.findOne({ id: req.param('id') });
  if (!document) return res.notFound(`Document not found`);

  if (document.modifiedDocJson) {
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
  const newFiles = [];
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
          newFiles.push(createdFile);
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

  const authorId = req.token.id;

  // Update json data (upcoming modifications which need to be validated)
  const documentData = await DocumentService.getConvertedDataFromClient(
    req.body
  );
  const descriptionData = DocumentService.getDescriptionDataFromClient(
    req.body,
    authorId
  );

  const updatedDocument = await DocumentService.updateDocument({
    documentId: req.param('id'),
    reviewerId: authorId,
    documentData,
    descriptionData,
    newFiles,
  });
  if (!updatedDocument) return res.notFound();

  // The returned document does not include the modifications as they have to be validated before being applied
  const doc = await DocumentService.appendPopulateForFullDocument(
    TDocument.findOne(updatedDocument.id)
  );
  await DocumentService.populateFullDocumentSubEntities(doc);

  await NotificationService.notifySubscribers(
    req,
    doc,
    authorId,
    NOTIFICATION_TYPES.UPDATE,
    NOTIFICATION_ENTITIES.DOCUMENT
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    doc,
    { controllerMethod: 'DocumentController.update' },
    res,
    toDocument
  );
};
