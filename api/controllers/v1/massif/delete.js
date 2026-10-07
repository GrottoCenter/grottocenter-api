const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const MassifService = require('../../../services/MassifService');
const RightService = require('../../../services/RightService');
const { toMassif } = require('../../../services/mapping/converters');
const NameService = require('../../../services/NameService');
const RecentChangeService = require('../../../services/RecentChangeService');
const CommonService = require('../../../services/CommonService');

// Re-points a massif's rows in a join table keyed on (otherColumn, id_massif)
// to the merge target, dropping those the target already has. `table` and
// `otherColumn` are constants from this file, never request input.
async function moveMassifLinks(db, table, otherColumn, fromId, toId) {
  await CommonService.query(
    `DELETE FROM ${table} d
       WHERE d.id_massif = $1
         AND EXISTS (
           SELECT 1 FROM ${table} k
           WHERE k.id_massif = $2 AND k.${otherColumn} = d.${otherColumn}
         )`,
    [fromId, toId],
    db
  );
  await CommonService.query(
    `UPDATE ${table} SET id_massif = $2 WHERE id_massif = $1`,
    [fromId, toId],
    db
  );
}

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete a massif.');
  }

  // Check if massif exists and if it's not already deleted
  const massifId = req.param('id');
  const massif = await MassifService.getPopulatedMassif(massifId);
  if (!massif) {
    return res.notFound({ message: `Massif of id ${massifId} not found.` });
  }

  if (!massif.isDeleted) {
    const redirectTo = parseInt(req.param('entityId'), 10);
    if (!Number.isNaN(redirectTo)) {
      massif.redirectTo = redirectTo;
      await TMassif.updateOne(massifId)
        .set({ redirectTo })
        .catch(() => {});
    }

    await TMassif.destroyOne({ id: massifId }); // Soft delete
    massif.isDeleted = true;

    await MassifService.deleteInSearch(massifId);
    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'massif',
      massifId,
      req.token.id
    );
  }

  const deletePermanently = !!req.param('isPermanent');
  const mergeIntoId = parseInt(req.param('entityId'), 10);
  let shouldMergeInto = !Number.isNaN(mergeIntoId);
  let mergeIntoEntity;
  if (shouldMergeInto) {
    mergeIntoEntity = await TMassif.findOne(mergeIntoId)
      .populate('documents')
      .populate('subscribedCavers');
    shouldMergeInto = !!mergeIntoEntity;
  }

  if (deletePermanently) {
    // Every step runs in one transaction: a failure on the final hard delete
    // (e.g. an FK not cleared below) must not leave behind a soft-deleted
    // massif already stripped of its names, documents and subscribers.
    await sails.getDatastore().transaction(async (db) => {
      await TMassif.update({ redirectTo: massifId })
        .set({ redirectTo: shouldMergeInto ? mergeIntoId : null })
        .usingConnection(db);
      await TNotification.destroy({ massif: massifId }).usingConnection(db);

      if (massif.documents.length > 0) {
        if (shouldMergeInto) {
          const currentDocuments = mergeIntoEntity.documents.map((e) => e.id);
          const newDocuments = massif.documents
            .map((e) => e.id)
            .filter((e) => !currentDocuments.includes(e));
          await TMassif.addToCollection(
            mergeIntoId,
            'documents',
            newDocuments
          ).usingConnection(db);
        }
        await TMassif.updateOne(massifId)
          .set({ documents: [] })
          .usingConnection(db);
      }

      // Deprecated single-massif link on documents. t_document first: its
      // update trigger copies the old row, id_massif included, into h_document.
      const documentMassif = shouldMergeInto ? mergeIntoId : null;
      await TDocument.update({ massif: massifId })
        .set({ massif: documentMassif })
        .usingConnection(db);
      await HDocument.update({ massif: massifId })
        .set({ massif: documentMassif })
        .usingConnection(db);

      // Guideline and organization coverage follows the massif into the merge
      // target, otherwise it is dropped, as guideline/delete.js does from the
      // other side. Rows the target already has are deleted first to avoid
      // violating the (id_guideline, id_massif) / (id_grotto, id_massif) keys.
      if (shouldMergeInto) {
        await moveMassifLinks(
          db,
          'j_guideline_massif',
          'id_guideline',
          massifId,
          mergeIntoId
        );
        await moveMassifLinks(
          db,
          'j_organization_massif',
          'id_grotto',
          massifId,
          mergeIntoId
        );
      } else {
        await JGuidelineMassif.destroy({ massif: massifId }).usingConnection(
          db
        );
        await JOrganizationMassif.destroy({ massif: massifId }).usingConnection(
          db
        );
      }

      if (massif.descriptions.length > 0) {
        // Even if the DB model support having multiple descriptions per massif the front UI does not allow to edit or remove them
        // So for now it is considered that a massif can have at most, one description
        await TDescription.destroy({ massif: massifId }).usingConnection(db); // TDescription first soft delete
        await HDescription.destroy({ massif: massifId }).usingConnection(db);
        await TDescription.destroy({ massif: massifId }).usingConnection(db);
      }

      const massifWithSub = await TMassif.findOne(massifId)
        .populate('subscribedCavers')
        .usingConnection(db);
      if (massifWithSub.subscribedCavers.length > 0) {
        if (shouldMergeInto) {
          const currentSubscriptions = mergeIntoEntity.subscribedCavers.map(
            (e) => e.id
          );
          const newSubscriptions = massifWithSub.subscribedCavers
            .map((e) => e.id)
            .filter((e) => !currentSubscriptions.includes(e));
          await TMassif.addToCollection(
            mergeIntoId,
            'subscribedCavers',
            newSubscriptions
          ).usingConnection(db);
        }
        await TMassif.updateOne(massifId)
          .set({ subscribedCavers: [] })
          .usingConnection(db);
      }

      await NameService.permanentDelete({ massif: massifId }, db);

      // Networks (caves with multiple entrances) are associated to the massif only because they are inside its polygon
      // No need to do special deletion

      await HMassif.destroy({ id: massifId }).usingConnection(db);
      await TMassif.destroyOne({ id: massifId }).usingConnection(db); // Hard delete
    });
  }

  await NotificationService.notifySubscribers(
    massif,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.MASSIF
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    massif,
    { controllerMethod: 'MassifController.delete' },
    res,
    toMassif
  );
};
