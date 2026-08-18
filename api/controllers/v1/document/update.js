const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const NotificationService = require('../../../services/NotificationService');
const FileService = require('../../../services/FileService');
const RightService = require('../../../services/RightService');
const { toDocument } = require('../../../services/mapping/converters');
const {
  TYPES_ALLOWING_ISSUE,
} = require('../../../../config/constants/document');

const { INVALID_FORMAT, INVALID_NAME, ERROR_DURING_UPLOAD_TO_AZURE } =
  FileService;

module.exports = async (req, res) => {
  const document = await TDocument.findOne({ id: req.param('id') });
  if (!document || document.isDeleted)
    return res.notFound(`Document not found`);

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

  // Validate that the issue field is only set for types that support it
  // (must run before file upload to avoid Azure side effects on invalid requests)
  const documentDataForValidation =
    await DocumentService.getConvertedDataFromClient(req.body);
  const effectiveType = documentDataForValidation.type ?? document.type;
  if (
    documentDataForValidation.issue != null &&
    !TYPES_ALLOWING_ISSUE.includes(effectiveType)
  ) {
    return res.badRequest(
      'The "issue" field is only allowed for documents of type Book or Issue. ' +
        'Articles should be linked to a parent document of type Issue instead.'
    );
  }

  // Reject cyclic parent assignments before any file upload side-effects.
  const proposedParentId = documentDataForValidation.parent;
  if (proposedParentId != null) {
    const documentId = req.param('id');
    const hasCycle = await DocumentService.checkParentCycle(
      Number(documentId),
      Number(proposedParentId)
    );
    if (hasCycle) {
      return res.badRequest(
        'The proposed parent would create a cycle in the document hierarchy.'
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

  // Reuse the already-converted data from the pre-upload validation
  const documentData = documentDataForValidation;

  const descriptionData = DocumentService.getDescriptionDataFromClient(
    req.body,
    authorId
  );

  const modifiedFiles = DocumentService.getChangedFileFromClient(
    req.body.modifiedFiles ?? []
  );

  const deletedFiles = DocumentService.getChangedFileFromClient(
    req.body.deletedFiles ?? []
  );

  const updatedDocument = await DocumentService.updateDocument({
    documentId: req.param('id'),
    reviewerId: authorId,
    documentData,
    descriptionData,
    newFiles,
    modifiedFiles,
    deletedFiles,
  });
  if (!updatedDocument) return res.notFound();

  // The returned document does not include the modifications as they have to be validated before being applied
  const doc = await DocumentService.getPopulatedDocument(updatedDocument.id);

  await NotificationService.notifySubscribers(
    doc,
    authorId,
    NotificationService.NOTIFICATION_TYPES.UPDATE,
    NotificationService.NOTIFICATION_ENTITIES.DOCUMENT
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
