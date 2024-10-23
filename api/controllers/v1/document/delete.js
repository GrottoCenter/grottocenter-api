const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const DocumentService = require('../../../services/DocumentService');
const RightService = require('../../../services/RightService');
const { toDocument } = require('../../../services/mapping/converters');
const FileService = require('../../../services/FileService');
const RecentChangeService = require('../../../services/RecentChangeService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a document.');
  }

  // Check if document exists and if it's not already deleted
  const documentId = req.param('id');
  const document = await DocumentService.getPopulatedDocument(documentId);
  if (!document) {
    return res.notFound({ message: `Document of id ${documentId} not found.` });
  }

  if (!document.isDeleted) {
    const redirectTo = parseInt(req.param('entityId'), 10);
    if (!Number.isNaN(redirectTo)) {
      document.redirectTo = redirectTo;
      await TDocument.updateOne(documentId)
        .set({ redirectTo })
        .catch(() => {});
    }

    await TDocument.destroyOne({ id: documentId }); // Soft delete
    document.isDeleted = true;

    await DocumentService.deleteESDocument(document).catch(() => {});
    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'document',
      documentId,
      req.token.id
    );
  }

  const deletePermanently = !!req.param('isPermanent');
  const mergeIntoId = parseInt(req.param('entityId'), 10);
  let shouldMergeInto = !Number.isNaN(mergeIntoId);
  let mergeIntoEntity;
  if (shouldMergeInto) {
    mergeIntoEntity = await DocumentService.appendPopulateForFullDocument(
      TDocument.findOne(mergeIntoId)
    );
    shouldMergeInto = !!mergeIntoEntity;
  }

  if (deletePermanently) {
    await TDocument.update({ redirectTo: documentId }).set({
      dateReviewed: new Date(), // Avoid a uniqueness error
      redirectTo: shouldMergeInto ? mergeIntoId : null,
    });
    await TDocument.update({ parent: documentId })
      .set({
        dateReviewed: new Date(), // Avoid a uniqueness error
        parent: shouldMergeInto ? mergeIntoId : null,
      })
      .meta({ fetch: false });
    await HDocument.update({ parent: documentId }).set({
      parent: shouldMergeInto ? mergeIntoId : null,
    });
    await TDocument.update({ authorizationDocument: documentId }).set({
      dateReviewed: new Date(), // Avoid a uniqueness error
      authorizationDocument: null,
    });

    await TNotification.destroy({ document: documentId });

    // eslint-disable-next-line no-inner-declarations
    async function linkedEntitiesDeleteOrMerge(key) {
      if (document[key].length === 0) return;
      if (shouldMergeInto) {
        const existingEntities = mergeIntoEntity[key].map((e) => e.id);
        const entitiesToAdd = document[key]
          .map((e) => e.id)
          .filter((e) => !existingEntities.includes(e));
        await TDocument.addToCollection(mergeIntoId, key, entitiesToAdd);
      }
      await TDocument.updateOne(documentId).set({ [key]: [] });
    }

    if (document.files.length > 0) {
      if (shouldMergeInto) {
        TFile.update({ document: documentId }).set({ document: mergeIntoId });
      } else {
        await Promise.all(
          document.files.map((e) => FileService.document.delete(e))
        );
      }
    }

    await linkedEntitiesDeleteOrMerge('countries');
    await linkedEntitiesDeleteOrMerge('isoRegions');
    await linkedEntitiesDeleteOrMerge('languages');
    await linkedEntitiesDeleteOrMerge('massifs');
    await linkedEntitiesDeleteOrMerge('subjects');
    await linkedEntitiesDeleteOrMerge('authorsGrotto');
    await linkedEntitiesDeleteOrMerge('authors');

    await TDocument.updateOne(documentId).set({ regions: [] });

    await TDocumentDuplicate.destroy({ id: documentId });

    // Documents have no TName but a TDescription instead
    await TDescription.destroy({ document: documentId }); // TDescription first soft delete
    await HDescription.destroy({ document: documentId });
    await TDescription.destroy({ document: documentId });

    await HDocument.destroy({ t_id: documentId });
    await TDocument.destroyOne({ id: documentId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    req,
    document,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.DOCUMENT
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    document,
    { controllerMethod: 'DocumentController.delete' },
    res,
    toDocument
  );
};
