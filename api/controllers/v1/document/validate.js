const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toDocument } = require('../../../services/mapping/converters');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');

// Unused by front
// TODO Remove ?
// eslint-disable-next-line consistent-return
module.exports = (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to validate a document.');
  }

  const isValidated = req.param('isValidated')
    ? !(req.param('isValidated').toLowerCase() === 'false')
    : true;
  const validationComment = req.param('validationComment', null);
  const id = req.param('id');

  if (isValidated === false && !validationComment) {
    return res.badRequest(
      `If the document with id ${req.param(
        'id'
      )} is refused, a comment must be provided.`
    );
  }

  TDocument.updateOne({ id })
    .set({
      dateValidation: new Date(),
      isValidated,
      validationComment,
      validator: req.token.id,
    })
    .then(async (updatedDocument) => {
      if (isValidated) {
        const populatedDoc =
          await DocumentService.appendPopulateForFullDocument(
            TDocument.findOne(id)
          );
        await DocumentService.populateFullDocumentSubEntities(populatedDoc);
        await DocumentService.addDocumentToElasticSearchIndexes(
          updatedDocument
        );
        await NotificationService.notifySubscribers(
          req,
          updatedDocument,
          req.token.id,
          NOTIFICATION_TYPES.VALIDATE,
          NOTIFICATION_ENTITIES.DOCUMENT
        );
      }

      const params = {
        controllerMethod: 'DocumentController.validate',
        notFoundMessage: `Document of id ${id} not found`,
        searchedItem: `Document of id ${id}`,
      };
      return ControllerService.treatAndConvert(
        req,
        null,
        updatedDocument,
        params,
        res,
        toDocument
      );
    });
};
