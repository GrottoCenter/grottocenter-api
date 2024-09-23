const ControllerService = require('../../../services/ControllerService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const NotificationService = require('../../../services/NotificationService');
const EntranceService = require('../../../services/EntranceService');
const RightService = require('../../../services/RightService');
const { toEntrance } = require('../../../services/mapping/converters');
const NameService = require('../../../services/NameService');
const CaveService = require('../../../services/CaveService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a entrance.');
  }

  // Check if entrance exists and if it's not already deleted
  const entranceId = req.param('id');
  const entrance = await EntranceService.getPopulatedEntrance(entranceId);
  if (!entrance) {
    return res.notFound({ message: `Entrance of id ${entranceId} not found.` });
  }

  if (!entrance.isDeleted) {
    const redirectTo = parseInt(req.param('entityId'), 10);
    if (!Number.isNaN(redirectTo)) {
      entrance.redirectTo = redirectTo;
      await TEntrance.updateOne(entranceId)
        .set({ redirectTo })
        .catch(() => {});
    }

    await TEntrance.destroyOne({ id: entranceId }); // Soft delete
    await ElasticsearchService.deleteResource('entrances', entranceId).catch(
      () => {}
    );
    entrance.isDeleted = true;
  }

  const deletePermanently = !!req.param('isPermanent');
  const mergeIntoId = parseInt(req.param('entityId'), 10);
  let shouldMergeInto = !Number.isNaN(mergeIntoId);
  let mergeIntoEntity;
  if (shouldMergeInto) {
    mergeIntoEntity = await TEntrance.findOne(mergeIntoId).populate('cave');
    shouldMergeInto = !!mergeIntoEntity;
  }

  if (deletePermanently) {
    await TEntrance.update({ redirectTo: entranceId }).set({
      redirectTo: shouldMergeInto ? mergeIntoId : null,
    });
    await TNotification.destroy({ entrance: entranceId });

    // eslint-disable-next-line no-inner-declarations
    async function subEntityDelete(
      subEntitiesKey,
      notificationKey,
      model,
      hModel
    ) {
      const subEntities = entrance[subEntitiesKey];
      if (subEntities.length === 0) return;

      await TNotification.destroy({
        [notificationKey]: subEntities.map((e) => e.id),
      });

      if (shouldMergeInto) {
        await model.update({ entrance: entranceId }).set({
          entrance: mergeIntoEntity.id,
        });
        await hModel
          .update({ entrance: entranceId })
          .set({ entrance: mergeIntoEntity.id });
      } else {
        await model.destroy({ entrance: entranceId }); // model first soft delete
        await hModel.destroy({ entrance: entranceId });
        await model.destroy({ entrance: entranceId });
      }
    }

    await subEntityDelete('locations', 'location', TLocation, HLocation);
    await subEntityDelete(
      'descriptions',
      'description',
      TDescription,
      HDescription
    );
    await subEntityDelete('riggings', 'rigging', TRigging, HRigging);
    await subEntityDelete('histories', 'history', THistory, HHistory);
    await subEntityDelete('comments', 'comment', TComment, HComment);

    if (entrance.documents.length > 0) {
      if (shouldMergeInto) {
        const newDocuments = entrance.documents.map((e) => e.id);
        await TEntrance.addToCollection(mergeIntoId, 'documents', newDocuments);
      }
      await HDocument.update({ entrance: entranceId }).set({ entrance: null });
      await TEntrance.updateOne(entranceId).set({ documents: [] });
    }

    if (entrance.cave && entrance.cave.entrances.length === 1) {
      await TEntrance.updateOne(entranceId).set({ cave: null });

      // When the associated cave only have this entrance, we also delete the cave
      const cave = await CaveService.getPopulatedCave(entrance.cave.id);
      if (!cave.isDeleted) await TCave.destroyOne({ id: cave.id }); // Soft delete
      await CaveService.permanentlyDeleteCave(
        cave,
        shouldMergeInto,
        mergeIntoEntity?.cave?.id
      );
    }

    await TEntrance.updateOne(entranceId).set({ explorerCavers: [] });
    await TEntranceDuplicate.destroy({ id: entranceId });

    await NameService.permanentDelete({ entrance: entranceId });

    await HEntrance.destroy({ t_id: entranceId });
    await TEntrance.destroyOne({ id: entranceId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    req,
    entrance,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.ENTRANCE
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    entrance,
    { controllerMethod: 'EntranceController.delete' },
    res,
    toEntrance
  );
};
