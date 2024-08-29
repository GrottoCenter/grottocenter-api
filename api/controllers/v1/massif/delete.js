const ControllerService = require('../../../services/ControllerService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const NotificationService = require('../../../services/NotificationService');
const MassifService = require('../../../services/MassifService');
const RightService = require('../../../services/RightService');
const { toMassif } = require('../../../services/mapping/converters');

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
    await ElasticsearchService.deleteResource('massifs', massifId).catch(
      () => {}
    );
    massif.isDeleted = true;
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
    if (massif.documents.length > 0) {
      if (shouldMergeInto) {
        const currentDocuments = mergeIntoEntity.documents.map((e) => e.id);
        const newDocuments = massif.documents
          .map((e) => e.id)
          .filter((e) => !currentDocuments.includes(e));
        await TMassif.addToCollection(mergeIntoId, 'documents', newDocuments);
      }
      await TMassif.updateOne(massifId).set({ documents: [] });
    }

    if (massif.descriptions.length > 0) {
      // Even if the DB model support having multiple descriptions per massif the front UI does not allow to edit or remove them
      // So for now it is considered that a massif can have at most, one description
      await TDescription.destroy({ massif: massifId }); // TDescription first soft delete
      await TDescription.destroy({ massif: massifId });
    }

    const massifWithSub =
      await TMassif.findOne(massifId).populate('subscribedCavers');
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
        );
      }
      await TMassif.updateOne(massifId).set({ subscribedCavers: [] });
    }

    await TName.destroy({ massif: massifId }); // TName first soft delete
    await TName.destroy({ massif: massifId });

    // Networks (caves with multiple entrances) are associated to the massif only because they are inside its polygon
    // No need to do special deletion

    await HMassif.destroy({ id: massifId });
    await TMassif.destroyOne({ id: massifId }); // Hard delete
  }

  await NotificationService.notifySubscribers(
    req,
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
