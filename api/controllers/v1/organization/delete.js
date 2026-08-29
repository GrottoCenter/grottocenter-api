const ControllerService = require('../../../services/ControllerService');
const NotificationService = require('../../../services/NotificationService');
const GrottoService = require('../../../services/GrottoService');
const RightService = require('../../../services/RightService');
const { toOrganization } = require('../../../services/mapping/converters');
const NameService = require('../../../services/NameService');
const RecentChangeService = require('../../../services/RecentChangeService');
const CommonService = require('../../../services/CommonService');

module.exports = async (req, res) => {
  const hasRight = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  if (!hasRight) {
    return res.forbidden('You are not authorized to delete an organization.');
  }

  // Check if organization exists and if it's not already deleted
  const organizationId = req.param('id');
  const organization =
    await GrottoService.getPopulatedOrganization(organizationId);
  if (!organization) {
    return res.notFound({
      message: `Organization of id ${organizationId} not found.`,
    });
  }

  if (!organization.isDeleted) {
    const redirectTo = parseInt(req.param('entityId'), 10);
    if (!Number.isNaN(redirectTo)) {
      organization.redirectTo = redirectTo;
      await TGrotto.updateOne({ id: organizationId })
        .set({ redirectTo })
        .catch(() => {});
    }
    await TGrotto.destroyOne({ id: organizationId }); // Soft delete
    organization.isDeleted = true;

    await GrottoService.deleteInSearch(organizationId);
    await RecentChangeService.setDeleteRestoreAuthor(
      'delete',
      'grotto',
      organizationId,
      req.token.id
    );
  }

  // eslint-disable-next-line no-inner-declarations
  async function reafectField(model, hModel, field, replacement = null) {
    await model
      .update({ [field]: organizationId })
      .set({ [field]: replacement });
    await hModel
      .update({ [field]: organizationId })
      .set({ [field]: replacement });
  }

  // The web client sends `?isPermanent=1`; accept the common truthy encodings
  // ('1'/'true', or a real boolean) while treating explicit falsy values
  // ('0'/'false') and an absent param as a soft delete. A bare `!!req.param(...)`
  // would wrongly treat `isPermanent=0`/`false` as permanent.
  const deletePermanently = [true, 'true', '1'].includes(
    req.param('isPermanent')
  );
  const mergeIntoId = parseInt(req.param('entityId'), 10);
  let shouldMergeInto = !Number.isNaN(mergeIntoId);
  let mergeIntoEntity;
  if (shouldMergeInto) {
    mergeIntoEntity = await TGrotto.findOne(mergeIntoId).populate('documents');
    shouldMergeInto = !!mergeIntoEntity;
  }

  if (deletePermanently) {
    if (
      organization.partnerNetworks.length > 0 ||
      organization.partnerEntrances.length > 0 ||
      organization.cavers.length > 0
    ) {
      // TODO Properly handle the removal of these properties once there are APIs to set/disable them
      return res.status(501).send();
    }

    // Explored caves: when merging into a surviving organization, re-point the
    // deleted org's relationships to it instead of dropping them. The join
    // table's PK is (id_cave, id_grotto), so first delete the deleted org's
    // rows for caves the survivor already explores to avoid a PK collision,
    // then re-point the remainder. Both statements run in a transaction: a
    // failure between them would delete the shared caves without ever handing
    // the rest over to the survivor. Without a merge target, drop them all.
    if (shouldMergeInto) {
      await sails.getDatastore().transaction(async (db) => {
        await CommonService.query(
          `DELETE FROM j_grotto_cave_explorer d
             WHERE d.id_grotto = $1
               AND EXISTS (
                 SELECT 1 FROM j_grotto_cave_explorer k
                 WHERE k.id_grotto = $2 AND k.id_cave = d.id_cave
               )`,
          [organizationId, mergeIntoId],
          db
        );
        await CommonService.query(
          `UPDATE j_grotto_cave_explorer
             SET id_grotto = $2
             WHERE id_grotto = $1`,
          [organizationId, mergeIntoId],
          db
        );
      });
    } else {
      await JGrottoCaveExplorer.destroy({ grotto: organizationId });
    }

    if (organization.documents.length > 0) {
      if (shouldMergeInto) {
        const existingDocuments = mergeIntoEntity.documents.map((e) => e.id);
        const documentsToAdd = organization.documents
          .map((e) => e.id)
          .filter((e) => !existingDocuments.includes(e));
        await TGrotto.addToCollection(mergeIntoId, 'documents', documentsToAdd);
      }
      await TGrotto.updateOne(organizationId).set({ documents: [] });
    }

    await reafectField(
      TDocument,
      HDocument,
      'editor',
      shouldMergeInto ? mergeIntoId : null
    );
    await reafectField(
      TDocument,
      HDocument,
      'library',
      shouldMergeInto ? mergeIntoId : null
    );

    await TGrotto.update({ redirectTo: organizationId }).set({
      redirectTo: shouldMergeInto ? mergeIntoId : null,
    });
    await TNotification.destroy({ grotto: organizationId });

    await NameService.permanentDelete({ grotto: organizationId });

    await HGrotto.destroy({ id: organizationId });
    await TGrotto.destroyOne({ id: organizationId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    organization,
    req.token.id,
    deletePermanently
      ? NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE
      : NotificationService.NOTIFICATION_TYPES.DELETE,
    NotificationService.NOTIFICATION_ENTITIES.ORGANIZATION
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
