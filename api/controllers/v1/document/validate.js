const ControllerService = require('../../../services/ControllerService');
const DocumentService = require('../../../services/DocumentService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toDocument } = require('../../../services/mapping/converters');

// Unused by front
// TODO Remove ?
// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
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
      `If the document with id ${id} is refused, a comment must be provided.`
    );
  }

  await TDocument.updateOne({ id }).set({
    dateValidation: new Date(),
    isValidated,
    validationComment,
    validator: req.token.id,
  });

  let populatedDoc;
  if (isValidated) {
    populatedDoc = await DocumentService.getPopulatedDocument(id);
    await DocumentService.createESDocument(populatedDoc);

    await NotificationService.notifySubscribers(
      req,
      populatedDoc,
      req.token.id,
      NotificationService.NOTIFICATION_TYPES.VALIDATE,
      NotificationService.NOTIFICATION_ENTITIES.DOCUMENT
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
    populatedDoc,
    params,
    res,
    toDocument
  );
};
