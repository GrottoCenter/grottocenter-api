const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const EntranceService = require('../../../services/EntranceService');
const RightService = require('../../../services/RightService');
const { toEntrance } = require('../../../services/mapping/converters');
const NameService = require('../../../services/NameService');
const CaveService = require('../../../services/CaveService');
const RecentChangeService = require('../../../services/RecentChangeService');
const CommonService = require('../../../services/CommonService');
const readBoolParam = require('../../../utils/readBoolParam');

// Outcomes of the permanent delete that are not a success
const GONE = 'gone';
const RESTORED = 'restored';

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
async function hardDestroy(model, criteria, db) {
  await model.destroy(criteria).usingConnection(db); // Soft delete (is_deleted = true)
  await model.destroy(criteria).usingConnection(db); // Hard delete (removes row)
}

/**
 * Delete sub-entities linked to an entrance.
 * History (h_) rows are intentionally NOT touched — they are preserved
 * for auditability; in merge paths the FK is reassigned via raw SQL,
 * in delete paths the original value is kept as an orphaned reference.
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
  mergeIntoEntity,
  db
) {
  const subEntities = entrance[subEntitiesKey];
  if (subEntities.length === 0) return;

  await TNotification.destroy({
    [notificationKey]: subEntities.map((e) => e.id),
  }).usingConnection(db);

  if (shouldMergeInto) {
    await model
      .update({ entrance: entranceId })
      .set({
        entrance: mergeIntoEntity.id,
      })
      .usingConnection(db);
  } else {
    await hardDestroy(model, { entrance: entranceId }, db);
  }
}

/**
 * Load what the permanent delete of an entrance reads: its row with its names
 * and documents, the ids of its sub-entities, and the entrances of its cave.
 *
 * Everything is read on `db`. A transaction holds its pool connection until
 * it ends, so a read through another one could wait for a connection held by
 * a concurrent delete that is itself waiting for this transaction's lock.
 */
async function loadForPermanentDelete(entranceId, db) {
  const entrance = await TEntrance.findOne(entranceId)
    .populate('names')
    .populate('documents')
    .usingConnection(db);
  const idsOf = (model, where) =>
    model.find({ where, select: ['id'] }).usingConnection(db);
  [
    entrance.locations,
    entrance.descriptions,
    entrance.riggings,
    entrance.histories,
    entrance.comments,
    entrance.caveEntrances,
  ] = await Promise.all([
    ...[TLocation, TDescription, TRigging, THistory, TComment].map((model) =>
      idsOf(model, { entrance: entranceId })
    ),
    entrance.cave ? idsOf(TEntrance, { cave: entrance.cave }) : [],
  ]);
  return entrance;
}

/**
 * Permanently delete an entrance, or merge it into `mergeIntoId`, in one
 * transaction, soft-deleting it first when it is not already.
 *
 * The entrance row is locked first, so a concurrent permanent delete or
 * merge of the same entrance waits for this one to finish, then finds the
 * entrance gone. Every query below runs on `db`: a write through another
 * connection to a row this transaction has locked would wait forever, and
 * a read through another connection could wait for a free one forever.
 *
 * @param {Object} params
 * @param {number} params.entranceId
 * @param {boolean} params.wasDeleted whether the entrance was soft-deleted
 *   when the request loaded it
 * @param {number} params.mergeIntoId NaN when not merging
 * @param {number} params.authorId the moderator deleting it
 * @param {Object} db the transaction
 * @returns {Promise<string|undefined>} GONE when the entrance no longer
 *   exists, RESTORED when it was restored since the request loaded it,
 *   nothing once it is deleted
 */
async function permanentlyDelete(
  { entranceId, wasDeleted, mergeIntoId, authorId },
  db
) {
  const { rows } = await CommonService.query(
    'SELECT is_deleted FROM t_entrance WHERE id = $1 FOR UPDATE',
    [entranceId],
    db
  );
  if (rows.length === 0) return GONE;
  const isDeleted = rows[0].is_deleted;
  if (wasDeleted && !isDeleted) return RESTORED;

  // Reloaded under the lock: what the request loaded at its start may
  // already be stale
  const entrance = await loadForPermanentDelete(entranceId, db);
  const deletesCave = !!entrance.cave && entrance.caveEntrances.length === 1;

  if (!isDeleted) {
    // Its redirect_to is not written: the row is about to be removed
    await TEntrance.destroyOne({ id: entranceId }).usingConnection(db); // Soft delete
    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'entrance',
      entranceId,
      authorId,
      db
    );
  }

  let shouldMergeInto = !Number.isNaN(mergeIntoId);
  let mergeIntoEntity;
  if (shouldMergeInto) {
    mergeIntoEntity = await TEntrance.findOne(mergeIntoId)
      .populate('cave')
      .usingConnection(db);
    shouldMergeInto = !!mergeIntoEntity;
  }

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
    ...(deletesCave && { cave: entrance.cave }),
  };
  sails.log.info(
    `Permanent ${action} entrance ${entranceId}: ${JSON.stringify(audit)}`
  );

  await Promise.all([
    TEntrance.update({ redirectTo: entranceId })
      .set({ redirectTo: target })
      .usingConnection(db),
    TNotification.destroy({ entrance: entranceId }).usingConnection(db),
  ]);

  await Promise.all(
    [
      ['locations', 'location', TLocation],
      ['descriptions', 'description', TDescription],
      ['riggings', 'rigging', TRigging],
      ['histories', 'history', THistory],
      ['comments', 'comment', TComment],
    ].map(([subEntitiesKey, notificationKey, model]) =>
      subEntityDelete(
        entrance,
        subEntitiesKey,
        notificationKey,
        model,
        entranceId,
        shouldMergeInto,
        mergeIntoEntity,
        db
      )
    )
  );

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
  const tModelExitUpdates = [TDescription, TRigging, TComment].map((model) =>
    model.update({ exit: entranceId }).set({ exit: target }).usingConnection(db)
  );

  if (shouldMergeInto) {
    // Reassign h_ references to the merge target
    await Promise.all([
      ...tModelExitUpdates,
      ...[
        'UPDATE h_location SET id_entrance = $1 WHERE id_entrance = $2',
        'UPDATE h_description SET id_entrance = $1 WHERE id_entrance = $2',
        'UPDATE h_description SET id_exit = $1 WHERE id_exit = $2',
        'UPDATE h_rigging SET id_entrance = $1 WHERE id_entrance = $2',
        'UPDATE h_rigging SET id_exit = $1 WHERE id_exit = $2',
        'UPDATE h_comment SET id_entrance = $1 WHERE id_entrance = $2',
        'UPDATE h_comment SET id_exit = $1 WHERE id_exit = $2',
        'UPDATE h_history SET id_entrance = $1 WHERE id_entrance = $2',
        'UPDATE h_name SET id_entrance = $1 WHERE id_entrance = $2',
      ].map((sql) => CommonService.query(sql, [target, entranceId], db)),
    ]);
  } else {
    // Pure delete: only null the T-model exit FKs (already nullable).
    // H-rows keep their original id_entrance — the FK constraint is gone,
    // so orphaned references won't block the hard delete.
    await Promise.all(tModelExitUpdates);
  }

  if (entrance.documents.length > 0) {
    if (shouldMergeInto) {
      // Skip documents the target already has: j_document_entrance is keyed
      // by (id_document, id_entrance), a second link would violate it (#1902).
      const existingDocuments = (
        await JDocumentEntrance.find({ entrance: mergeIntoId }).usingConnection(
          db
        )
      ).map((e) => e.document);
      const documentsToAdd = entrance.documents
        .map((e) => e.id)
        .filter((e) => !existingDocuments.includes(e));
      await TEntrance.addToCollection(
        mergeIntoId,
        'documents',
        documentsToAdd
      ).usingConnection(db);
    }
    await TEntrance.updateOne(entranceId)
      .set({ documents: [] })
      .usingConnection(db);
  }

  if (deletesCave) {
    await TEntrance.updateOne(entranceId)
      .set({ cave: null })
      .usingConnection(db);

    // When the associated cave only has this entrance, also delete the cave.
    // Read on `db`, where this entrance is already detached from it.
    await CommonService.query(
      'SELECT id FROM t_cave WHERE id = $1 FOR UPDATE',
      [entrance.cave],
      db
    );
    const cave = await TCave.findOne(entrance.cave)
      .populate('names')
      .populate('entrances')
      .populate('descriptions')
      .populate('documents')
      .usingConnection(db);
    // Already gone if a concurrent request deleted it
    if (cave) {
      if (!cave.isDeleted) {
        await TCave.destroyOne({ id: cave.id }).usingConnection(db); // Soft delete
      }
      await CaveService.permanentlyDeleteCave(
        cave,
        shouldMergeInto,
        mergeIntoEntity?.cave?.id,
        db
      );
    }
  }

  await Promise.all([
    TEntrance.updateOne(entranceId)
      .set({ explorerCavers: [] })
      .usingConnection(db),
    TEntranceDuplicate.destroy({ id: entranceId }).usingConnection(db),
    NameService.permanentDelete({ entrance: entranceId }, db),
  ]);

  await TEntrance.destroyOne({ id: entranceId }).usingConnection(db); // Hard delete
  return undefined;
}

module.exports = async (req, res) => {
  const hasModeratorRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  const hasAdminRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );
  if (!hasModeratorRight && !hasAdminRight) {
    return res.forbidden('You are not authorized to delete a entrance.');
  }

  // Read before any write: an invalid value must not leave a half-done delete.
  const { value: deletePermanently, error: isPermanentError } = readBoolParam(
    req,
    'isPermanent',
    false
  );
  if (isPermanentError) return res.badRequest(isPermanentError);

  // Permanent (irreversible) deletion is gated to administrators; moderators
  // may only soft-delete (matches device/delete.js, guideline/delete.js).
  if (deletePermanently && !hasAdminRight) {
    return res.forbidden(
      'You are not authorized to permanently delete a entrance.'
    );
  }

  const entranceId = Number(req.param('id'));
  const entrance = await EntranceService.getPopulatedEntrance(entranceId);
  if (!entrance) {
    return res.notFound({ message: `Entrance of id ${entranceId} not found.` });
  }

  // Built before the entrance is touched: once it is gone, there is nothing
  // left to read it from. Nothing is written until the delete went through
  const pendingNotification =
    await NotificationService.prepareSubscribersNotification(
      entrance,
      req.token.id,
      deletePermanently
        ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
        : NotificationService.NOTIFICATION_TYPES.DELETE,
      NotificationService.NOTIFICATION_ENTITIES.ENTRANCE
    );

  const redirectTo = parseInt(req.param('entityId'), 10);

  if (!deletePermanently && !entrance.isDeleted) {
    if (!Number.isNaN(redirectTo)) {
      entrance.redirectTo = redirectTo;
      await TEntrance.updateOne(entranceId)
        .set({ redirectTo })
        .catch(() => {});
    }

    await TEntrance.destroyOne({ id: entranceId }); // Soft delete
    entrance.isDeleted = true;

    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'entrance',
      entranceId,
      req.token.id
    );
  }

  if (deletePermanently) {
    // `async` is required: Sails awaits the callback only when it is an
    // AsyncFunction, and otherwise commits as soon as it returns
    const outcome = await sails.getDatastore().transaction(async (db) =>
      permanentlyDelete(
        {
          entranceId,
          wasDeleted: entrance.isDeleted,
          mergeIntoId: redirectTo,
          authorId: req.token.id,
        },
        db
      )
    );
    if (outcome === GONE) {
      return res.notFound({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }
    if (outcome === RESTORED) {
      return res.conflict({
        message: `Entrance of id ${entranceId} was restored during its permanent deletion.`,
      });
    }
    entrance.isDeleted = true;
  }

  // Fire-and-forget: don't block the response on subscriber notifications
  NotificationService.dispatchSubscribersNotification(
    pendingNotification
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
