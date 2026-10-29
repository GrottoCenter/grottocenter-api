const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const GrottoService = require('../../../services/GrottoService');
const RightService = require('../../../services/RightService');
const { toOrganization } = require('../../../services/mapping/converters');
const NameService = require('../../../services/NameService');
const RecentChangeService = require('../../../services/RecentChangeService');
const CommonService = require('../../../services/CommonService');
const readBoolParam = require('../../../utils/readBoolParam');

// Junction tables referencing t_grotto, with the column that completes their
// (id_grotto, <column>) primary key or unique constraint. Constants only: they
// are interpolated into SQL.
const ORGANIZATION_JUNCTIONS = [
  ['j_organization_country', 'id_country'],
  ['j_organization_region', 'id_region'],
  ['j_organization_massif', 'id_massif'],
  ['j_grotto_cave_explorer', 'id_cave'],
  ['j_grotto_cave_partner', 'id_cave'],
  ['j_grotto_caver', 'id_caver'],
];

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
    return res.forbidden('You are not authorized to delete an organization.');
  }

  // Check if organization exists and if it's not already deleted
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
      'You are not authorized to permanently delete an organization.'
    );
  }

  const organizationId = req.param('id');
  const organization =
    await GrottoService.getPopulatedOrganization(organizationId);
  if (!organization) {
    return res.notFound({
      message: `Organization of id ${organizationId} not found.`,
    });
  }

  // Built before the organization is touched: once it is gone, there is nothing
  // left to read it from. Nothing is written until the delete went through
  const pendingNotification =
    await NotificationService.prepareSubscribersNotification(
      organization,
      req.token.id,
      deletePermanently
        ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
        : NotificationService.NOTIFICATION_TYPES.DELETE,
      NotificationService.NOTIFICATION_ENTITIES.ORGANIZATION
    );

  if (!organization.isDeleted) {
    // Soft delete only a row still live, and never through destroyOne: the
    // t_grotto delete trigger turns a DELETE into a hard delete once the row is
    // flagged, so a concurrent request that flagged it after the read above
    // would make this one remove the organization for good (#1921). The
    // request that loses the race leaves the row to the winner.
    const softDeleted = await TGrotto.updateOne({
      id: organizationId,
      isDeleted: false,
    }).set({ isDeleted: true });
    organization.isDeleted = true;

    if (softDeleted) {
      const redirectTo = parseInt(req.param('entityId'), 10);
      if (!Number.isNaN(redirectTo)) {
        organization.redirectTo = redirectTo;
        await TGrotto.updateOne({ id: organizationId })
          .set({ redirectTo })
          .catch(() => {});
      }

      await RecentChangeService.setDeleteRestoreAuthor(
        'delete',
        'grotto',
        organizationId,
        req.token.id
      );
    }
  }

  const mergeIntoId = parseInt(req.param('entityId'), 10);
  let shouldMergeInto = !Number.isNaN(mergeIntoId);
  let mergeIntoEntity;
  if (shouldMergeInto) {
    mergeIntoEntity = await TGrotto.findOne(mergeIntoId).populate('documents');
    shouldMergeInto = !!mergeIntoEntity;
  }

  if (deletePermanently) {
    // Junction rows (explored and partner caves, cavers, countries, regions,
    // massifs): when merging into a surviving organization, re-point the
    // deleted org's rows to it instead of dropping them. Each table's key is
    // (id_grotto, <other id>), so first delete the deleted org's rows the
    // survivor already holds to avoid a key collision, then re-point the
    // remainder. Every statement runs in one transaction: a failure between
    // them would delete the shared rows without ever handing the rest over to
    // the survivor (#1783, #1795, #1904). Without a merge target, drop them
    // all.
    if (shouldMergeInto) {
      await sails.getDatastore().transaction(async (db) => {
        for (const [table, otherColumn] of ORGANIZATION_JUNCTIONS) {
          // eslint-disable-next-line no-await-in-loop
          await CommonService.query(
            `DELETE FROM ${table} d
               WHERE d.id_grotto = $1
                 AND EXISTS (
                   SELECT 1 FROM ${table} k
                   WHERE k.id_grotto = $2 AND k.${otherColumn} = d.${otherColumn}
                 )`,
            [organizationId, mergeIntoId],
            db
          );
          // eslint-disable-next-line no-await-in-loop
          await CommonService.query(
            `UPDATE ${table} SET id_grotto = $2 WHERE id_grotto = $1`,
            [organizationId, mergeIntoId],
            db
          );
        }
      });
    } else {
      await JGrottoCaveExplorer.destroy({ grotto: organizationId });
      await JGrottoCavePartner.destroy({ grotto: organizationId });
      await JGrottoCaver.destroy({ grotto: organizationId });
      await JOrganizationCountry.destroy({ grotto: organizationId });
      await JOrganizationRegion.destroy({ grotto: organizationId });
      await JOrganizationMassif.destroy({ grotto: organizationId });
    }

    // Authorship links must be read uncapped and straight from the association:
    // the populated organization only carries a preview page of the documents it
    // authored, which would silently drop the rest of the authorship rows.
    const { documents: authoredDocuments } =
      await TGrotto.findOne(organizationId).populate('documents');

    if (authoredDocuments.length > 0) {
      if (shouldMergeInto) {
        const existingDocuments = mergeIntoEntity.documents.map((e) => e.id);
        const documentsToAdd = authoredDocuments
          .map((e) => e.id)
          .filter((e) => !existingDocuments.includes(e));
        await TGrotto.addToCollection(mergeIntoId, 'documents', documentsToAdd);
      }
      await TGrotto.updateOne(organizationId).set({ documents: [] });
    }

    // Documents edited or held by the organization go to the merge target, or
    // lose the link. The t_document update trigger copies each old row into
    // h_document under (id, date_reviewed): an update leaving date_reviewed
    // untouched reuses the current review date, which the history may already
    // hold. One statement setting date_reviewed touches each document once,
    // under a key no history row can have yet (#1757).
    const documentReplacement = shouldMergeInto ? mergeIntoId : null;
    await sails.getDatastore().transaction(async (db) => {
      await CommonService.query(
        `UPDATE t_document SET
           id_editor = CASE WHEN id_editor = $1 THEN $2 ELSE id_editor END,
           id_library = CASE WHEN id_library = $1 THEN $2 ELSE id_library END,
           date_reviewed = now()
         WHERE id_editor = $1 OR id_library = $1`,
        [organizationId, documentReplacement],
        db
      );
      await HDocument.update({ editor: organizationId })
        .set({ editor: documentReplacement })
        .usingConnection(db);
      await HDocument.update({ library: organizationId })
        .set({ library: documentReplacement })
        .usingConnection(db);
    });

    await TGrotto.update({ redirectTo: organizationId }).set({
      redirectTo: shouldMergeInto ? mergeIntoId : null,
    });
    await TNotification.destroy({ grotto: organizationId });

    await NameService.permanentDelete({ grotto: organizationId });

    await HGrotto.destroy({ id: organizationId });
    await TGrotto.destroyOne({ id: organizationId }); // Hard delete
  }

  await NotificationService.dispatchSubscribersNotification(
    pendingNotification
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    organization,
    { controllerMethod: 'GrottoController.delete' },
    res,
    toOrganization
  );
};
