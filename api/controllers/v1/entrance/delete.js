const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const EntranceService = require('../../../services/EntranceService');
const RightService = require('../../../services/RightService');
const { toEntrance } = require('../../../services/mapping/converters');
const NameService = require('../../../services/NameService');
const CaveService = require('../../../services/CaveService');
const RecentChangeService = require('../../../services/RecentChangeService');
const CommonService = require('../../../services/CommonService');

/**
 * Hard-delete rows matching `criteria` from `model`.
 *
 * Waterline uses a two-phase destroy for models with `is_deleted`:
 *   1st destroy() → sets is_deleted = true (soft delete)
 *   2nd destroy() → removes the row (hard delete, since it's already soft-deleted)
 *
 * This helper encapsulates that convention so the intent is explicit and
 * any future Waterline behaviour change only needs fixing in one place.
 */
async function hardDestroy(model, criteria) {
  await model.destroy(criteria); // Soft delete (is_deleted = true)
  await model.destroy(criteria); // Hard delete (removes row)
}

/**
 * Delete sub-entities linked to an entrance.
 * History (h_) rows are intentionally NOT touched — they are preserved
 * for auditability with FK references nulled via raw SQL separately.
 *
 * IMPORTANT: When adding a new sub-entity type here, also add a matching
 * h_ UPDATE in the raw SQL block below (search for "h_location" to find it).
 */
async function subEntityDelete(
  entrance,
  subEntitiesKey,
  notificationKey,
  model,
  entranceId,
  shouldMergeInto,
  mergeIntoEntity
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
  } else {
    await hardDestroy(model, { entrance: entranceId });
  }
}

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a entrance.');
  }

  const entranceId = Number(req.param('id'));
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
    entrance.isDeleted = true;

    await Promise.all([
      EntranceService.deleteInSearch(entranceId),
      RecentChangeService.setDeleteRestoreAuthor(
        'delete',
        'entrance',
        entranceId,
        req.token.id
      ),
    ]);
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
    const action = shouldMergeInto ? 'merge' : 'delete';
    const target = shouldMergeInto ? mergeIntoEntity.id : null;
    const ids = (arr) => arr.map((e) => e.id);
    const audit = {
      action,
      entranceId,
      ...(shouldMergeInto && { mergeIntoId }),
      locations: ids(entrance.locations),
      descriptions: ids(entrance.descriptions),
      riggings: ids(entrance.riggings),
      histories: ids(entrance.histories),
      comments: ids(entrance.comments),
      documents: ids(entrance.documents),
      names: ids(entrance.names),
      ...(entrance.cave &&
        entrance.cave.entrances.length === 1 && {
          cave: entrance.cave.id,
        }),
    };
    sails.log.info(
      `Permanent ${action} entrance ${entranceId}: ${JSON.stringify(audit)}`
    );

    await Promise.all([
      TEntrance.update({ redirectTo: entranceId }).set({ redirectTo: target }),
      TNotification.destroy({ entrance: entranceId }),
    ]);

    await Promise.all([
      subEntityDelete(
        entrance,
        'locations',
        'location',
        TLocation,
        entranceId,
        shouldMergeInto,
        mergeIntoEntity
      ),
      subEntityDelete(
        entrance,
        'descriptions',
        'description',
        TDescription,
        entranceId,
        shouldMergeInto,
        mergeIntoEntity
      ),
      subEntityDelete(
        entrance,
        'riggings',
        'rigging',
        TRigging,
        entranceId,
        shouldMergeInto,
        mergeIntoEntity
      ),
      subEntityDelete(
        entrance,
        'histories',
        'history',
        THistory,
        entranceId,
        shouldMergeInto,
        mergeIntoEntity
      ),
      subEntityDelete(
        entrance,
        'comments',
        'comment',
        TComment,
        entranceId,
        shouldMergeInto,
        mergeIntoEntity
      ),
    ]);

    // Clean up FK references to this entrance in T-models (secondary 'exit' FK)
    // and, when merging, reassign H-model references to the surviving entrance.
    //
    // When NOT merging (pure delete), h_ rows intentionally keep their original
    // id_entrance value. The FK constraints have been dropped (see migration
    // 1_2026_05_05_drop_history_parent_fk.sql), so orphaned references are safe
    // and preserve full traceability for audit purposes.
    //
    // Raw SQL is required because Waterline silently fails on composite-PK models.
    //
    // IMPORTANT: This block must cover every h_ table that has an id_entrance
    // or id_exit column. If a new sub-entity type is added to subEntityDelete
    // above, a matching h_ UPDATE must be added here.
    const tModelExitUpdates = [
      TDescription.update({ exit: entranceId }).set({ exit: target }),
      TRigging.update({ exit: entranceId }).set({ exit: target }),
      TComment.update({ exit: entranceId }).set({ exit: target }),
    ];

    if (shouldMergeInto) {
      // Reassign h_ references to the merge target
      await Promise.all([
        ...tModelExitUpdates,
        CommonService.query(
          'UPDATE h_location SET id_entrance = $1 WHERE id_entrance = $2',
          [target, entranceId]
        ),
        CommonService.query(
          'UPDATE h_description SET id_entrance = $1 WHERE id_entrance = $2',
          [target, entranceId]
        ),
        CommonService.query(
          'UPDATE h_description SET id_exit = $1 WHERE id_exit = $2',
          [target, entranceId]
        ),
        CommonService.query(
          'UPDATE h_rigging SET id_entrance = $1 WHERE id_entrance = $2',
          [target, entranceId]
        ),
        CommonService.query(
          'UPDATE h_rigging SET id_exit = $1 WHERE id_exit = $2',
          [target, entranceId]
        ),
        CommonService.query(
          'UPDATE h_comment SET id_entrance = $1 WHERE id_entrance = $2',
          [target, entranceId]
        ),
        CommonService.query(
          'UPDATE h_comment SET id_exit = $1 WHERE id_exit = $2',
          [target, entranceId]
        ),
        CommonService.query(
          'UPDATE h_history SET id_entrance = $1 WHERE id_entrance = $2',
          [target, entranceId]
        ),
        CommonService.query(
          'UPDATE h_name SET id_entrance = $1 WHERE id_entrance = $2',
          [target, entranceId]
        ),
      ]);
    } else {
      // Pure delete: only null the T-model exit FKs (already nullable).
      // H-rows keep their original id_entrance — the FK constraint is gone,
      // so orphaned references won't block the hard delete.
      await Promise.all(tModelExitUpdates);
    }

    if (entrance.documents.length > 0) {
      if (shouldMergeInto) {
        const newDocuments = entrance.documents.map((e) => e.id);
        await TEntrance.addToCollection(mergeIntoId, 'documents', newDocuments);
      }
      await TEntrance.updateOne(entranceId).set({ documents: [] });
    }

    if (entrance.cave && entrance.cave.entrances.length === 1) {
      await TEntrance.updateOne(entranceId).set({ cave: null });

      // When the associated cave only has this entrance, also delete the cave
      const cave = await CaveService.getPopulatedCave(entrance.cave.id);
      if (!cave.isDeleted) await TCave.destroyOne({ id: cave.id }); // Soft delete
      await CaveService.permanentlyDeleteCave(
        cave,
        shouldMergeInto,
        mergeIntoEntity?.cave?.id
      );
    }

    await Promise.all([
      TEntrance.updateOne(entranceId).set({ explorerCavers: [] }),
      TEntranceDuplicate.destroy({ id: entranceId }),
      NameService.permanentDelete({ entrance: entranceId }),
    ]);

    await TEntrance.destroyOne({ id: entranceId }); // Hard delete
  }

  // Fire-and-forget: don't block the response on subscriber notifications
  NotificationService.notifySubscribers(
    entrance,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.ENTRANCE
  ).catch((err) => {
    sails.log.error(
      `Failed to notify subscribers for entrance ${entranceId}: ${err.message}`
    );
  });

  return ControllerService.treatAndConvert(
    req,
    null,
    entrance,
    { controllerMethod: 'EntranceController.delete' },
    res,
    toEntrance
  );
};
