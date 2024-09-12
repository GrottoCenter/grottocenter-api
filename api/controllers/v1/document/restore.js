const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const DocumentService = require('../../../services/DocumentService');
const { toDocument } = require('../../../services/mapping/converters');
const RightService = require('../../../services/RightService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight)
    return res.forbidden('You are not authorized to restore a document.');

  const documentId = req.param('id');
  const document = await DocumentService.getPopulatedDocument(documentId);
  if (!document || !document.isDeleted) {
    return res.notFound({
      message: `Document of id ${documentId} not found or not deleted.`,
    });
  }

  await TDocument.updateOne({ id: documentId }).set({
    isDeleted: false,
    redirectTo: null,
  });
  document.isDeleted = false;
  document.redirectTo = null;

  await DocumentService.deleteESDocument(document).catch(() => {});

  await NotificationService.notifySubscribers(
    req,
    document,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.RESTORE,
    NotificationService.NOTIFICATION_ENTITIES.DOCUMENT
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    document,
    { controllerMethod: 'DocumentController.restore' },
    res,
    toDocument
  );
};
