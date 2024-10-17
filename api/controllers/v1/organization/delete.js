const ControllerService = require('../../../services/ControllerService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const NotificationService = require('../../../services/NotificationService');
const GrottoService = require('../../../services/GrottoService');
const RightService = require('../../../services/RightService');
const { toOrganization } = require('../../../services/mapping/converters');
const NameService = require('../../../services/NameService');
const RecentChangeService = require('../../../services/RecentChangeService');

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

    await ElasticsearchService.deleteResource('grottos', organizationId).catch(
      () => {}
    );
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

  const deletePermanently = !!req.param('isPermanent');
  const mergeIntoId = parseInt(req.param('entityId'), 10);
  let shouldMergeInto = !Number.isNaN(mergeIntoId);
  let mergeIntoEntity;
  if (shouldMergeInto) {
    mergeIntoEntity = await TGrotto.findOne(mergeIntoId).populate('documents');
    shouldMergeInto = !!mergeIntoEntity;
  }

  if (deletePermanently) {
    if (
      organization.exploredNetworks.length > 0 ||
      organization.exploredEntrances.length > 0 ||
      organization.partnerNetworks.length > 0 ||
      organization.partnerEntrances.length > 0 ||
      organization.cavers.length > 0
    ) {
      // TODO Properly handle the removal of these properties once there are APIs to set/disable them
      return res.status(501).send();
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
    req,
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
